#!/usr/bin/env python3
"""
KattaBaza — kanal ko'chirish dvigateli (userbot / MTProto).

MUHIM DIZAYN QARORI
-------------------
Bu skript `forward` ham, `copyMessage` ham ISHLATMAYDI.
Har bir fayl yuklab olinadi va bizning kanalga QAYTA yuklanadi.

Sabab — sizning talabingiz: "manba kanal yoki uning posti o'chib ketsa,
bizning kontentga ta'sir qilmasligi kerak".

  • forward  → "Forwarded from X" yozuvi qoladi.                        ❌
  • copy     → tez va bepul, LEKIN Telegram serveridagi AYNI BIR fayl
               obyektiga ishora qiladi. Manba kanal butunlay o'chirilsa
               yoki bloklansa, nusxa ham buzilishi mumkin.              ⚠️
  • qayta yuklash → bizda mutlaqo mustaqil fayl obyekti bo'ladi.        ✅

Narxi: trafik va vaqt. 100 ta × 100 MB = 10 GB yuklab olish + 10 GB yuklash.

ISHLATISH
---------
    # 1. Avval nima ko'chishini KO'RING (hech nima yozilmaydi)
    python -m bot.mirror @manba_kanal --to @mening_kanalim --limit 20 --dry-run

    # 2. Kichik test
    python -m bot.mirror @manba_kanal --to @mening_kanalim --limit 5

    # 3. To'liq (uzilsa — xuddi shu buyruq davom ettiradi)
    python -m bot.mirror @manba_kanal --to @mening_kanalim --type document
"""

from __future__ import annotations

import argparse
import asyncio
import shutil
import sys
import time
from pathlib import Path

from telethon import TelegramClient
from telethon.errors import (
    ChannelPrivateError,
    ChatForwardsRestrictedError,
    FloodWaitError,
)
from telethon.tl.types import (
    DocumentAttributeFilename,
    DocumentAttributeVideo,
    MessageMediaDocument,
    MessageMediaPhoto,
)

from . import db
from .analyze import analyze
from .clean import build_filename, clean_caption, derive_title, split_ext
from .config import cfg

KIND_BY_EXT = {
    "zip": "archive", "rar": "archive", "7z": "archive",
    "exe": "app", "msi": "app", "apk": "app", "dmg": "app",
    "pdf": "book", "epub": "book", "djvu": "book", "fb2": "book",
    "mp4": "video", "mkv": "video", "avi": "video", "webm": "video", "mov": "video",
    "mp3": "audio", "m4a": "audio", "ogg": "audio", "wav": "audio",
    "doc": "doc", "docx": "doc", "ppt": "doc", "pptx": "doc",
    "xls": "doc", "xlsx": "doc",
}


def human(n: int | None) -> str:
    if not n:
        return "0 B"
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


# ---------------------------------------------------------------
# Xabarni tahlil qilish
# ---------------------------------------------------------------

def media_info(msg) -> dict | None:
    """Xabardan fayl ma'lumotini oladi. Media bo'lmasa None."""
    if isinstance(msg.media, MessageMediaPhoto) or msg.photo:
        return {"kind": "photo", "ext": ".jpg", "name": None,
                "size": getattr(msg.file, "size", None), "video": None}

    if isinstance(msg.media, MessageMediaDocument) and msg.document:
        doc = msg.document
        name = None
        video_attr = None
        for a in doc.attributes:
            if isinstance(a, DocumentAttributeFilename):
                name = a.file_name
            elif isinstance(a, DocumentAttributeVideo):
                video_attr = a

        ext = split_ext(name)[1] if name else (
            "." + (msg.file.ext.lstrip(".") if msg.file and msg.file.ext else "bin")
        )
        return {"kind": "document", "ext": ext, "name": name,
                "size": doc.size, "video": video_attr}

    return None


def type_matches(info: dict, wanted: str) -> bool:
    if wanted == "all":
        return True
    ext = info["ext"].lstrip(".").lower()
    kind = KIND_BY_EXT.get(ext, info["kind"])
    if wanted == "video":
        return kind == "video" or info["video"] is not None
    if wanted == "book":
        return kind == "book"
    if wanted == "app":
        return kind in ("app", "archive")
    if wanted == "photo":
        return info["kind"] == "photo"
    if wanted == "document":
        return info["kind"] == "document"
    return True


# ---------------------------------------------------------------
# Asosiy oqim
# ---------------------------------------------------------------

async def mirror(args) -> int:
    problems = cfg.validate()
    if problems and not args.dry_run:
        print("❌ Sozlamalar to'liq emas:", file=sys.stderr)
        for p in problems:
            print(f"   • {p}", file=sys.stderr)
        return 1

    cfg.work_dir.mkdir(parents=True, exist_ok=True)

    client = TelegramClient(cfg.session_name, cfg.api_id, cfg.api_hash,
                            flood_sleep_threshold=120)
    await client.start()
    me = await client.get_me()
    print(f"👤 Userbot: {me.first_name} (@{me.username or '—'})")

    # --- Kanallarni topish ---
    try:
        source = await client.get_entity(args.source)
    except (ValueError, ChannelPrivateError) as e:
        print(f"❌ Manba kanal topilmadi yoki yopiq: {args.source} ({e})", file=sys.stderr)
        await client.disconnect()
        return 1

    target = None
    if not args.dry_run:
        try:
            target = await client.get_entity(args.to)
        except (ValueError, ChannelPrivateError) as e:
            print(f"❌ Maqsad kanal topilmadi: {args.to} ({e})\n"
                  f"   Userbot akkaunti o'sha kanalga ADMIN qilinganmi?", file=sys.stderr)
            await client.disconnect()
            return 1

    src_id = source.id if source.id < 0 else int(f"-100{source.id}")
    print(f"📥 Manba : {getattr(source, 'title', args.source)}")
    print(f"📤 Maqsad: {getattr(target, 'title', args.to) if target else '(dry-run)'}")

    # --- Baza va progress ---
    conn_ctx = None
    last_seen = 0
    if not args.dry_run:
        conn_ctx = db.connect()
        db.upsert_channel(conn_ctx, tg_chat_id=src_id,
                          username=getattr(source, "username", None),
                          title=getattr(source, "title", None), role="source")
        tgt_id = target.id if target.id < 0 else int(f"-100{target.id}")
        db.upsert_channel(conn_ctx, tg_chat_id=tgt_id,
                          username=getattr(target, "username", None),
                          title=getattr(target, "title", None), role="target",
                          topic=args.topic)
        last_seen = db.get_progress(conn_ctx, src_id) if args.resume else 0
        if last_seen:
            print(f"↩️  Davom ettirilmoqda: {last_seen}-xabardan keyin")

    stats = {"seen": 0, "copied": 0, "dup": 0, "skip": 0, "fail": 0, "bytes": 0,
             "review": 0}
    t0 = time.time()

    try:
        # reverse=True → eskidan yangiga; progress shunda ishonchli saqlanadi
        async for msg in client.iter_messages(source, reverse=True, min_id=last_seen):
            stats["seen"] += 1
            info = media_info(msg)

            if not info:
                stats["skip"] += 1
                continue
            if not type_matches(info, args.type):
                stats["skip"] += 1
                continue
            if info["size"] and info["size"] > cfg.max_file_mb * 1024 * 1024:
                print(f"   ⏭️  {msg.id}: juda katta ({human(info['size'])})")
                stats["skip"] += 1
                continue

            caption = clean_caption(msg.message)
            title = derive_title(caption, info["name"] or "")
            filename = build_filename(info["name"], title, info["ext"])

            # 🤖 Analiz agenti — kategoriya, til, yil, ishonch darajasi
            an = analyze(
                filename=filename,
                caption=caption,
                ext=info["ext"],
                posted_at=msg.date,
                source_topic=args.topic,
            )
            if args.only_topic and an.target_topic != args.only_topic:
                stats["skip"] += 1
                continue

            if args.dry_run:
                flag = "⚠️" if an.needs_review else "  "
                print(f"   {flag} {msg.id:>7} | {human(info['size']):>9} | "
                      f"{an.summary()} | {filename}")
                stats["copied"] += 1
                if stats["copied"] >= (args.limit or 10**9):
                    break
                continue

            # --- Manba bo'yicha tez dublikat tekshiruvi ---
            if db.find_duplicate(conn_ctx, source_chat_id=src_id, source_msg_id=msg.id):
                stats["dup"] += 1
                db.save_progress(conn_ctx, src_id, msg.id)
                continue

            work = cfg.work_dir / str(msg.id)
            work.mkdir(parents=True, exist_ok=True)
            path = work / filename

            try:
                # 1) Yuklab olish
                await msg.download_media(file=str(path))
                if not path.exists():
                    raise RuntimeError("fayl yuklanmadi")

                # 2) Mazmun bo'yicha dublikat (asosiy tekshiruv)
                digest = db.sha256_file(path)
                if db.find_duplicate(conn_ctx, sha256=digest):
                    stats["dup"] += 1
                    db.save_progress(conn_ctx, src_id, msg.id)
                    continue

                # 3) QAYTA YUKLASH — yangi, mustaqil fayl obyekti
                send_kwargs = {
                    "caption": caption or None,
                    "force_document": info["kind"] == "document" and info["video"] is None,
                }
                if info["video"] is not None:
                    send_kwargs["supports_streaming"] = True
                    send_kwargs["force_document"] = False
                # ⚠️ Manba thumbnail'i UZATILMAYDI — unda vodiy belgisi bo'lishi mumkin.
                #    Telegram yangi thumbnail o'zi yasaydi.

                sent = await client.send_file(target, str(path), **send_kwargs)

                # 4) Bazaga yozish
                size = path.stat().st_size
                ext = split_ext(filename)[1].lstrip(".").lower()
                sent_file = getattr(sent, "file", None)
                mid = db.insert_material(conn_ctx, {
                    "title": an.title or title,
                    "description": caption or None,
                    "kind": KIND_BY_EXT.get(ext, info["kind"]),
                    "file_type": ext or None,
                    "size_bytes": size,
                    "tg_file_id": str(getattr(sent_file, "id", "") or ""),
                    "tg_file_unique_id": None,
                    "sha256": digest,
                    "source_chat_id": src_id,
                    "source_msg_id": msg.id,
                    "target_chat_id": tgt_id,
                    "target_msg_id": sent.id,
                    "post_link": (f"https://t.me/{target.username}/{sent.id}"
                                  if getattr(target, "username", None) else None),
                    "lang": an.lang if an.lang != "unknown" else None,
                    "lang_detected": an.lang,
                    "year": an.year,
                    "form": an.form,
                    "confidence": an.confidence,
                    "needs_review": an.needs_review,
                    # ⭐ MANBADA joylangan sana — saytdagi tartib shu bo'yicha
                    "source_posted_at": msg.date,
                })
                if mid:
                    cats = list(an.categories)
                    if args.topic and args.topic not in cats:
                        cats.append(args.topic)
                    db.attach_categories(conn_ctx, mid, cats)

                stats["copied"] += 1
                stats["bytes"] += size
                if an.needs_review:
                    stats["review"] += 1
                db.save_progress(conn_ctx, src_id, msg.id)
                flag = "⚠️" if an.needs_review else "✅"
                print(f"   {flag} {msg.id:>7} | {human(size):>9} | "
                      f"{an.summary()} | {filename}")

            except ChatForwardsRestrictedError:
                print(f"   🔒 {msg.id}: kanal nusxalashni taqiqlagan", file=sys.stderr)
                stats["fail"] += 1
            except FloodWaitError as e:
                print(f"   ⏸️  FloodWait: {e.seconds}s kutilmoqda…", file=sys.stderr)
                await asyncio.sleep(e.seconds + 5)
                continue                       # bu xabarni keyingi yurishda oladi
            except Exception as e:             # noqa: BLE001
                print(f"   ❌ {msg.id}: {type(e).__name__}: {e}", file=sys.stderr)
                stats["fail"] += 1
            finally:
                shutil.rmtree(work, ignore_errors=True)

            # --- Tempo: ban bo'lmaslik uchun ---
            await asyncio.sleep(cfg.delay_seconds)
            if stats["copied"] and stats["copied"] % cfg.batch_pause_every == 0:
                print(f"   💤 {cfg.batch_pause_every} ta — {cfg.batch_pause_seconds}s pauza")
                await asyncio.sleep(cfg.batch_pause_seconds)

            if args.limit and stats["copied"] >= args.limit:
                print(f"   🛑 Limit ({args.limit}) ga yetdi")
                break

    except KeyboardInterrupt:
        print("\n⏹️  To'xtatildi — progress saqlandi, xuddi shu buyruq davom ettiradi.")
    finally:
        if conn_ctx is not None:
            conn_ctx.close()
        await client.disconnect()

    dt = time.time() - t0
    print(f"\n{'─' * 52}")
    print(f"Ko'rildi : {stats['seen']}")
    print(f"Ko'chdi  : {stats['copied']}  ({human(stats['bytes'])})")
    print(f"Dublikat : {stats['dup']}")
    print(f"O'tkazildi: {stats['skip']}")
    print(f"Xato     : {stats['fail']}")
    if stats["review"]:
        print(f"⚠️  Qo'lda ko'rish kerak: {stats['review']} ta "
              f"(select * from materials where needs_review)")
    print(f"Vaqt     : {dt/60:.1f} daqiqa")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Kanaldan kanalga fayllarni MUSTAQIL nusxa qilib ko'chirish")
    ap.add_argument("source", help="manba kanal: @username yoki -100…")
    ap.add_argument("--to", help="maqsad kanal: @username yoki -100…")
    ap.add_argument("--type", default="all",
                    choices=["all", "video", "book", "app", "photo", "document"])
    ap.add_argument("--topic", help="kategoriya slug, masalan 'medicina'")
    ap.add_argument("--limit", type=int, help="nechta fayldan keyin to'xtash")
    ap.add_argument("--only-topic",
                    help="faqat shu mavzuga tegishli fayllar (analiz agenti qaroriga ko'ra), "
                         "masalan 'medicina'")
    ap.add_argument("--dry-run", action="store_true",
                    help="hech nima ko'chirmaydi, faqat ro'yxatni ko'rsatadi")
    ap.add_argument("--no-resume", dest="resume", action="store_false",
                    help="boshidan boshlash (odatda kerak emas)")
    args = ap.parse_args()

    if not args.dry_run and not args.to:
        ap.error("--to majburiy (dry-run dan tashqari)")

    return asyncio.run(mirror(args))


if __name__ == "__main__":
    sys.exit(main())

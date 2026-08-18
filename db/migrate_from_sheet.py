#!/usr/bin/env python3
"""
KattaBaza — Google Sheet -> Postgres (Supabase) migratsiyasi.

Ishlatish:
    pip install httpx psycopg[binary] python-dotenv
    python db/migrate_from_sheet.py --dry-run     # avval SINAB ko'ring
    python db/migrate_from_sheet.py               # haqiqiy yozish

.env fayli kerak (.env.example dan nusxa oling).
Skript idempotent: qayta ishga tushirsa dublikat yaratmaydi (post_link bo'yicha upsert).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from datetime import datetime, timezone

import httpx
import psycopg
from dotenv import load_dotenv

load_dotenv()

SHEET_ID = os.getenv("SHEET_ID", "1z7O8Xlq5WN3VRv45lEyTu4QpW6O3tEcefsg5O5y1y5g")
SHEET_BASE = f"https://opensheet.elk.sh/{SHEET_ID}"
DB_URL = os.getenv("DATABASE_URL")

# Sheet'dagi file_type -> materials.kind
KIND_BY_EXT = {
    "zip": "archive", "rar": "archive", "7z": "archive",
    "exe": "app", "msi": "app", "apk": "app", "dmg": "app", "deb": "app",
    "pdf": "book", "epub": "book", "djvu": "book", "fb2": "book",
    "mp4": "video", "mkv": "video", "avi": "video", "webm": "video",
    "mp3": "audio", "m4a": "audio", "wav": "audio",
    "doc": "doc", "docx": "doc", "ppt": "doc", "pptx": "doc", "xls": "doc", "xlsx": "doc",
}


def parse_size_mb(raw: str | None) -> int | None:
    """'135,23' / '135.23' / '1 024' -> baytlar. Sheet'da vergul kasr ajratgichi."""
    if not raw:
        return None
    s = str(raw).strip().replace(" ", "").replace(" ", "")
    if not s:
        return None
    # Agar ham nuqta ham vergul bo'lsa: vergul mingliklar ajratgichi
    if "," in s and "." in s:
        s = s.replace(",", "")
    else:
        s = s.replace(",", ".")
    try:
        return int(round(float(s) * 1024 * 1024))
    except ValueError:
        return None


def split_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [p.strip() for p in re.split(r"[,;|]", str(raw)) if p.strip()]


def slugify(text: str) -> str:
    """O'zbek lotin apostroflarini (o', g', ʻ, ʼ, ') olib tashlaydi, keyin slug qiladi."""
    s = text.strip().lower()
    s = re.sub(r"[‘’ʻʼʽ'`´]", "", s)   # o'zbek -> ozbek
    s = re.sub(r"[^a-z0-9Ѐ-ӿ]+", "-", s)
    return s.strip("-") or "boshqa"


def parse_ts(raw: str | None) -> datetime | None:
    if not raw:
        return None
    raw = str(raw).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d",
                "%d.%m.%Y %H:%M:%S", "%d.%m.%Y"):
        try:
            return datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def parse_msg_id(post_link: str | None) -> int | None:
    """https://t.me/appskattabaza/203 -> 203 ; https://t.me/IT_6700 -> None"""
    if not post_link:
        return None
    m = re.match(r"^https?://t\.me/(?:c/\d+/|[\w_]+/)(\d+)/?$", post_link.strip())
    return int(m.group(1)) if m else None


DATE_LIKE = re.compile(r"^\d{4}-\d{2}-\d{2}[ T]\d{1,2}:\d{2}")


def repair_row(r: dict) -> dict:
    """
    Sheet'dagi ustun siljishini tuzatadi.

    241/242-qatorlarda `created_at` bo'sh qolib, sana `channel_ID` ustuniga
    tushib qolgan. Bunday qatorni tashlab ketmasdan, qiymatlarni joyiga qo'yamiz.
    """
    ch = str(r.get("channel_ID") or "").strip()
    created = str(r.get("created_at") or "").strip()

    if DATE_LIKE.match(ch):                 # sana channel_ID da turibdi
        if not created:
            r["created_at"] = ch            # sanani joyiga qaytaramiz
        r["channel_ID"] = ""                # channel_ID ni bo'shatamiz
        r["_repaired"] = True

    # file_type "..." yoki "Web" kabi axlat bo'lsa — havoladan chiqaramiz
    ft = str(r.get("file_type") or "").strip().lower().lstrip(".")
    if ft in {"", "...", "…", "web", "-", "n/a"}:
        url = str(r.get("file_url") or "")
        m = re.search(r"\.([a-z0-9]{2,5})(?:\?|$)", url.lower())
        r["file_type"] = m.group(1) if m else ""
        if not r["file_type"] and url.startswith("http"):
            r["_kind_hint"] = "link"        # fayl emas, oddiy havola

    return r


def channel_id_from_link(post_link: str | None, username_map: dict[str, int]) -> int | None:
    """post_link dagi @username orqali channels jadvalidan chat_id topadi."""
    if not post_link:
        return None
    m = re.match(r"^https?://t\.me/([\w_]+)", post_link.strip())
    return username_map.get(m.group(1).lower()) if m else None


def fetch_tab(client: httpx.Client, tab: str) -> list[dict]:
    for name in (tab, tab.replace("_", " "), tab.title()):
        try:
            r = client.get(f"{SHEET_BASE}/{name}", timeout=45)
            if r.status_code == 200:
                data = r.json()
                if isinstance(data, list) and data:
                    print(f"  '{name}' varag'i: {len(data)} qator")
                    return data
        except Exception as e:  # noqa: BLE001
            print(f"  '{name}' o'qilmadi: {e}", file=sys.stderr)
    print(f"  ⚠️  '{tab}' varag'i bo'sh yoki topilmadi")
    return []


UPSERT_MATERIAL = """
insert into materials (
    title, description, author, version, kind, platform, file_type,
    size_bytes, external_url, preview_url, gallery_urls,
    post_link, target_chat_id, target_msg_id, tags, status, created_at, published_at
) values (
    %(title)s, %(description)s, %(author)s, %(version)s, %(kind)s, %(platform)s, %(file_type)s,
    %(size_bytes)s, %(external_url)s, %(preview_url)s, %(gallery_urls)s,
    %(post_link)s, %(target_chat_id)s, %(target_msg_id)s, %(tags)s, 'published',
    coalesce(%(created_at)s, now()), coalesce(%(created_at)s, now())
)
on conflict (post_link) where post_link is not null
do update set
    title        = excluded.title,
    description  = excluded.description,
    author       = excluded.author,
    version      = excluded.version,
    kind         = excluded.kind,
    platform     = excluded.platform,
    file_type    = excluded.file_type,
    size_bytes   = excluded.size_bytes,
    external_url = excluded.external_url,
    preview_url  = excluded.preview_url,
    gallery_urls = excluded.gallery_urls,
    tags         = excluded.tags,
    updated_at   = now()
returning id;
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Bazaga yozmasdan sinash")
    args = ap.parse_args()

    if not args.dry_run and not DB_URL:
        print("❌ DATABASE_URL yo'q. .env faylini to'ldiring.", file=sys.stderr)
        return 1

    print("📥 Google Sheet o'qilyapti…")
    with httpx.Client(follow_redirects=True) as client:
        materials = fetch_tab(client, "Materials")
        channels = fetch_tab(client, "Channels")

    if not materials:
        print("❌ Materials bo'sh — to'xtatildi.", file=sys.stderr)
        return 1

    # username -> chat_id xaritasi (siljigan qatorlarni tiklash uchun)
    username_map: dict[str, int] = {}
    for ch in channels:
        cid = str(ch.get("channel_ID") or "").strip()
        uname = str(ch.get("username") or ch.get("Name") or "").strip().lstrip("@").lower()
        if re.fullmatch(r"-?\d+", cid) and uname:
            username_map[uname] = int(cid)
    username_map.setdefault("appskattabaza", -1002875124213)

    # ---- Tayyorlash -------------------------------------------------
    rows, cat_map, skipped, repaired = [], {}, 0, 0
    for r in materials:
        r = repair_row(dict(r))
        if r.pop("_repaired", False):
            repaired += 1

        title = (r.get("title") or "").strip()
        if not title:
            skipped += 1
            continue

        ext = (r.get("file_type") or "").strip().lower().lstrip(".")
        post_link = (r.get("post_link") or "").strip().rstrip("/") or None
        chat_id = (r.get("channel_ID") or "").strip()

        cats = [slugify(c) for c in split_list(r.get("categories"))]
        for c_slug, c_raw in zip(cats, split_list(r.get("categories"))):
            cat_map.setdefault(c_slug, c_raw)

        rows.append({
            "title": title,
            "description": (r.get("description") or "").strip() or None,
            "author": (r.get("author") or "").strip() or None,
            "version": (r.get("version") or "").strip() or None,
            "kind": r.pop("_kind_hint", None) or KIND_BY_EXT.get(ext, "file"),
            "platform": (r.get("platform") or "").strip().lower() or None,
            "file_type": ext or None,
            "size_bytes": parse_size_mb(r.get("size_mb")),
            "external_url": (r.get("file_url") or "").strip() or None,
            "preview_url": (r.get("preview_url") or "").strip() or None,
            "gallery_urls": split_list(r.get("gallery_urls")),
            "post_link": post_link,
            "target_chat_id": (int(chat_id) if re.fullmatch(r"-?\d+", chat_id)
                               else channel_id_from_link(post_link, username_map)),
            "target_msg_id": parse_msg_id(post_link),
            "tags": split_list(r.get("tags")),
            "created_at": parse_ts(r.get("created_at")),
            "_cats": cats,
        })

    print(f"\n📊 {len(rows)} material tayyor, {skipped} tashlab ketildi (sarlavhasiz)")
    print(f"   Kategoriyalar ({len(cat_map)}): {', '.join(sorted(cat_map)[:15])}")
    no_size = sum(1 for r in rows if not r["size_bytes"])
    no_link = sum(1 for r in rows if not r["post_link"])
    no_msg = sum(1 for r in rows if r["post_link"] and not r["target_msg_id"])
    print(f"   ⚠️  Hajmi noma'lum: {no_size} | post_link yo'q: {no_link} | "
          f"xabar ID siz havola: {no_msg}")
    if repaired:
        print(f"   🔧 Ustun siljishi tuzatildi: {repaired} qator")

    if args.dry_run:
        print("\n🔍 DRY RUN — bazaga hech nima yozilmadi. Namuna:")
        for r in rows[:3]:
            print(f"   • {r['title']} | {r['kind']}/{r['platform']} | "
                  f"{(r['size_bytes'] or 0)/1048576:.1f} MB | {r['_cats']}")
        return 0

    # ---- Yozish -----------------------------------------------------
    with psycopg.connect(DB_URL, autocommit=False) as conn, conn.cursor() as cur:
        # Kanallar
        for ch in channels:
            cid = (ch.get("channel_ID") or ch.get("chat_id") or "").strip()
            if not re.fullmatch(r"-?\d+", cid):
                continue
            cur.execute("""
                insert into channels (tg_chat_id, username, title, role, topic)
                values (%s, %s, %s, 'target', %s)
                on conflict (tg_chat_id) do update
                  set username = coalesce(excluded.username, channels.username),
                      title    = coalesce(excluded.title, channels.title)
            """, (int(cid),
                  (ch.get("username") or "").strip().lstrip("@") or None,
                  (ch.get("title") or ch.get("name") or "").strip() or None,
                  (ch.get("topic") or ch.get("category") or "").strip() or None))

        # Kategoriyalar
        cat_ids = {}
        for slug, name in cat_map.items():
            cur.execute("""
                insert into categories (slug, name_uz) values (%s, %s)
                on conflict (slug) do update set name_uz = excluded.name_uz
                returning id
            """, (slug, name))
            cat_ids[slug] = cur.fetchone()[0]

        # Materiallar
        done = 0
        for r in rows:
            cats = r.pop("_cats")
            cur.execute(UPSERT_MATERIAL, r)
            mid = cur.fetchone()[0]
            cur.execute("delete from material_categories where material_id = %s", (mid,))
            for slug in cats:
                if slug in cat_ids:
                    cur.execute(
                        "insert into material_categories (material_id, category_id) "
                        "values (%s, %s) on conflict do nothing",
                        (mid, cat_ids[slug]))
            done += 1
            if done % 100 == 0:
                print(f"   … {done}/{len(rows)}")

        conn.commit()

    print(f"\n✅ Tayyor: {done} material, {len(cat_ids)} kategoriya, {len(channels)} kanal.")
    print("   Tekshirish: select count(*) from materials;")
    return 0


if __name__ == "__main__":
    sys.exit(main())

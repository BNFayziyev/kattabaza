"""Postgres bilan ishlash — dublikat nazorati va material yozish."""

from __future__ import annotations

import hashlib
import re
from contextlib import contextmanager
from pathlib import Path
from typing import Any

import psycopg
from psycopg.rows import dict_row

from .config import cfg


@contextmanager
def conn():
    with psycopg.connect(cfg.database_url, row_factory=dict_row) as c:
        yield c


def connect():
    """
    Uzoq ishlaydigan jarayon uchun oddiy ulanish (finally da .close() qiling).

    ⚠️ Supabase'ning "Transaction pooler" i (6543-port, pgbouncer) tayyorlangan
    so'rovlarni (prepared statements) qo'llab-quvvatlamaydi. psycopg3 esa bir
    so'rov 5 marta takrorlangach ularni avtomatik yoqadi — natijada ko'chirish
    o'rtasida "prepared statement already exists" xatosi chiqadi.
    Shuning uchun 6543-portda uni o'chiramiz.
    """
    kwargs = {"row_factory": dict_row}
    if ":6543" in (cfg.database_url or ""):
        kwargs["prepare_threshold"] = None
    try:
        return psycopg.connect(cfg.database_url, **kwargs)
    except TypeError:
        # Eski psycopg versiyasi prepare_threshold ni bilmasa
        kwargs.pop("prepare_threshold", None)
        conn_obj = psycopg.connect(cfg.database_url, **kwargs)
        try:
            conn_obj.prepare_threshold = None
        except Exception:  # noqa: BLE001
            pass
        return conn_obj


def sha256_file(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while block := f.read(chunk):
            h.update(block)
    return h.hexdigest()


# ---------------------------------------------------------------
# Dublikat nazorati
# ---------------------------------------------------------------

def find_duplicate(c, *, sha256: str | None = None,
                   source_chat_id: int | None = None,
                   source_msg_id: int | None = None) -> dict | None:
    """
    Bu fayl allaqachon bormi?

    ⚠️ Manba `tg_file_unique_id` bo'yicha tekshirmaymiz — biz faylni qayta
    yuklaymiz, ya'ni bizning nusxamizda BOSHQA unique_id bo'ladi. Yagona
    ishonchli belgi — fayl mazmunining sha256 hash'i.
    """
    with c.cursor() as cur:
        if sha256:
            cur.execute("select id, title, status from materials where sha256 = %s", (sha256,))
            if row := cur.fetchone():
                return row
        if source_chat_id and source_msg_id:
            cur.execute(
                "select id, title, status from materials "
                "where source_chat_id = %s and source_msg_id = %s",
                (source_chat_id, source_msg_id),
            )
            if row := cur.fetchone():
                return row
    return None


# ---------------------------------------------------------------
# Material yozish
# ---------------------------------------------------------------

INSERT_MATERIAL = """
insert into materials (
    title, description, kind, file_type, size_bytes,
    tg_file_id, tg_file_unique_id, sha256,
    source_chat_id, source_msg_id,
    target_chat_id, target_msg_id, post_link,
    lang, lang_detected, year, form, confidence, needs_review,
    source_posted_at,
    status, published_at
) values (
    %(title)s, %(description)s, %(kind)s, %(file_type)s, %(size_bytes)s,
    %(tg_file_id)s, %(tg_file_unique_id)s, %(sha256)s,
    %(source_chat_id)s, %(source_msg_id)s,
    %(target_chat_id)s, %(target_msg_id)s, %(post_link)s,
    %(lang)s, %(lang_detected)s, %(year)s, %(form)s, %(confidence)s, %(needs_review)s,
    %(source_posted_at)s,
    'published', now()
)
on conflict (sha256) where sha256 is not null do nothing
returning id;
"""


def insert_material(c, data: dict[str, Any]) -> int | None:
    with c.cursor() as cur:
        cur.execute(INSERT_MATERIAL, data)
        row = cur.fetchone()
    c.commit()
    return row["id"] if row else None


def attach_categories(c, material_id: int, slugs: list[str]) -> None:
    if not slugs:
        return
    with c.cursor() as cur:
        for slug in slugs:
            cur.execute(
                "insert into categories (slug, name_uz) values (%s, %s) "
                "on conflict (slug) do nothing", (slug, slug))
            cur.execute(
                "insert into material_categories (material_id, category_id) "
                "select %s, id from categories where slug = %s "
                "on conflict do nothing", (material_id, slug))
    c.commit()


# ---------------------------------------------------------------
# Kanallar va progress
# ---------------------------------------------------------------

def get_channel(c, username_or_id: str | int) -> dict | None:
    with c.cursor() as cur:
        if isinstance(username_or_id, int) or str(username_or_id).lstrip("-").isdigit():
            cur.execute("select * from channels where tg_chat_id = %s", (int(username_or_id),))
        else:
            cur.execute("select * from channels where lower(username) = lower(%s)",
                        (str(username_or_id).lstrip("@"),))
        return cur.fetchone()


def upsert_channel(c, *, tg_chat_id: int, username: str | None, title: str | None,
                   role: str, topic: str | None = None) -> dict:
    with c.cursor() as cur:
        cur.execute("""
            insert into channels (tg_chat_id, username, title, role, topic)
            values (%s, %s, %s, %s, %s)
            on conflict (tg_chat_id) do update
              set username = coalesce(excluded.username, channels.username),
                  title    = coalesce(excluded.title, channels.title),
                  role     = excluded.role,
                  topic    = coalesce(excluded.topic, channels.topic)
            returning *
        """, (tg_chat_id, username, title, role, topic))
        row = cur.fetchone()
    c.commit()
    return row


def save_progress(c, tg_chat_id: int, last_msg_id: int) -> None:
    """Ko'chirish qayerda to'xtaganini eslab qoladi — uzilsa davom ettiriladi."""
    with c.cursor() as cur:
        cur.execute(
            "update channels set last_synced_msg_id = greatest(coalesce(last_synced_msg_id,0), %s) "
            "where tg_chat_id = %s", (last_msg_id, tg_chat_id))
    c.commit()


def get_progress(c, tg_chat_id: int) -> int:
    with c.cursor() as cur:
        cur.execute("select coalesce(last_synced_msg_id, 0) as m from channels where tg_chat_id = %s",
                    (tg_chat_id,))
        row = cur.fetchone()
    return row["m"] if row else 0


# ---------------------------------------------------------------
# Manbalar ro'yxati (kanal biosiga qo'yish uchun)
# ---------------------------------------------------------------

def source_list(c) -> list[dict]:
    """
    Foydalanilgan manbalar ro'yxati — kanal biosida ko'rsatish uchun.
    Bu ma'lumot BAZADA saqlanadi, postlarga chiqmaydi.
    """
    with c.cursor() as cur:
        cur.execute("""
            select coalesce(ch.username, m.source_chat_id::text) as source,
                   ch.title,
                   count(*) as materials
              from materials m
              left join channels ch on ch.tg_chat_id = m.source_chat_id
             where m.source_chat_id is not null
             group by 1, 2
             order by materials desc
        """)
        return cur.fetchall()


# ---------------------------------------------------------------
# Tekshiruv:  python -m bot.db
# ---------------------------------------------------------------
if __name__ == "__main__":
    import sys

    if not cfg.database_url:
        print("❌ DATABASE_URL yo'q. .env faylini tekshiring.", file=sys.stderr)
        raise SystemExit(1)

    # Parolni ko'rsatmasdan manzilni chiqaramiz
    safe = re.sub(r"://([^:]+):[^@]*@", r"://\1:***@", cfg.database_url)
    print(f"🔌 Ulanmoqda: {safe}")

    try:
        c = connect()
    except Exception as e:  # noqa: BLE001
        print(f"\n❌ Ulanib bo'lmadi: {type(e).__name__}: {e}\n", file=sys.stderr)
        print("Tez-tez uchraydigan sabablar:", file=sys.stderr)
        print("  • parol noto'g'ri — [YOUR-PASSWORD] o'rniga haqiqiy parol qo'yilganmi?", file=sys.stderr)
        print("  • 'Direct connection' tanlangan — u IPv6 talab qiladi.", file=sys.stderr)
        print("    Supabase'da 'Session pooler' variantini oling.", file=sys.stderr)
        raise SystemExit(1)

    try:
        with c.cursor() as cur:
            cur.execute("select current_database() as db, version() as v")
            row = cur.fetchone()
            print(f"✅ Ulandi: {row['db']}")
            print(f"   {row['v'].split(' on ')[0]}")

            cur.execute("""
                select
                  (select count(*) from materials)  as materiallar,
                  (select count(*) from channels)   as kanallar,
                  (select count(*) from categories) as kategoriyalar,
                  (select count(*) from materials where needs_review) as korish_kerak
            """)
            s = cur.fetchone()
            print(f"\n📊 Materiallar : {s['materiallar']}")
            print(f"   Kanallar    : {s['kanallar']}")
            print(f"   Kategoriyalar: {s['kategoriyalar']}")
            if s["korish_kerak"]:
                print(f"   ⚠️ Qo'lda ko'rish kerak: {s['korish_kerak']}")

            cur.execute("select count(*) as n from search_materials('')")
            print(f"\n✅ Qidiruv funksiyasi ishlayapti ({cur.fetchone()['n']} natija)")
        print("\n🎉 Baza tayyor — userbotga o'tsa bo'ladi.")
    finally:
        c.close()

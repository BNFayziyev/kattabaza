"""
Caption va fayl nomini tozalash.

Talab: manba kanal haqidagi HECH QANDAY ma'lumot bizning kanalga o'tmasin.
Bu modul matndan @mention, t.me havolalar, "obuna bo'ling" chaqiriqlari va
emoji-reklama qatorlarini olib tashlaydi.

Modul toza Python — bazasiz, tarmoqsiz test qilinadi: python -m bot.clean
"""

from __future__ import annotations

import re
import unicodedata

# ---------------------------------------------------------------
# Olib tashlanadigan naqshlar
# ---------------------------------------------------------------

RE_TG_LINK = re.compile(
    r"(?:https?://)?(?:t\.me|telegram\.me|telegram\.dog)/[^\s)\]]+",
    re.IGNORECASE,
)
# {2,31}: haqiqiy Telegram username ≥5 belgi, lekin fayl nomidagi "@med" kabi
# qisqa izlar ham olib tashlanishi kerak. Oldidagi (?<![\w/]) email manzilni
# (user@mail.com) himoya qiladi.
RE_MENTION = re.compile(r"(?<![\w/])@[A-Za-z][A-Za-z0-9_]{2,31}\b")
RE_TG_PROTO = re.compile(r"tg://[^\s)\]]+", re.IGNORECASE)
RE_HASHTAG_PROMO = re.compile(
    r"#\w*(?:kanal|channel|подпис|obuna|reklama|reklama_uchun)\w*", re.IGNORECASE
)

# "Obuna bo'ling", "Подписывайтесь", "Join us" kabi chaqiriq qatorlari
CALL_TO_ACTION = re.compile(
    r"^\s*[^\w\n]{0,4}\s*(?:"
    r"obuna\s*bo[’'`ʻ]?l\w*|kanalga\s*qo[’'`ʻ]?sh\w*|kanalimiz\w*|"
    r"bizni\s*kuzat\w*|batafsil\s*kanal\w*|reklama\s*uchun|admin\s*bilan|"
    r"подпис\w*|наш\s*канал|по\s*вопросам|реклама\s*[-—:]|связь\s*с\s*админ\w*|"
    r"join\s+(?:us|our)\w*|subscribe\w*|our\s+channel|for\s+ads?\b"
    r").*$",
    re.IGNORECASE | re.MULTILINE,
)

# Faqat emoji/belgidan iborat "bezak" qatorlar
DECOR_LINE = re.compile(r"^[\W_]{2,}$", re.MULTILINE)

# Havola olib tashlangach yetim qolgan yorliq: "Batafsil:", "Manba —", "Link:"
ORPHAN_LABEL = re.compile(r"^\W*[\w’'`ʻ]+(?:\s+[\w’'`ʻ]+){0,3}\s*[:\-–—>]\s*$")

INVISIBLE = dict.fromkeys(
    map(ord, "​‌‍‎‏⁠﻿"), None
)


def clean_caption(text: str | None, max_len: int = 1024) -> str:
    """
    Manba izlarini olib tashlaydi va toza caption qaytaradi.

    Bo'sh natija qaytishi mumkin — bu normal, caption umuman qo'yilmaydi.
    """
    if not text:
        return ""

    s = unicodedata.normalize("NFKC", text).translate(INVISIBLE)

    s = RE_TG_LINK.sub(" ", s)
    s = RE_TG_PROTO.sub(" ", s)
    s = RE_MENTION.sub(" ", s)
    s = RE_HASHTAG_PROMO.sub(" ", s)
    s = CALL_TO_ACTION.sub("", s)
    s = DECOR_LINE.sub("", s)

    # Qatorlarni tozalash
    lines = []
    for raw in s.splitlines():
        line = re.sub(r"[ \t]{2,}", " ", raw).strip(" \t-–—•·|")
        if not line:
            continue
        # Harf umuman qolmagan qatorni tashlaymiz
        if not re.search(r"\w", line):
            continue
        # "Batafsil:" kabi yetim yorliq — havola olib tashlangandan keyin qolgan
        if ORPHAN_LABEL.match(line):
            continue
        lines.append(line)

    # Ketma-ket takrorlangan qatorlarni olib tashlash
    out: list[str] = []
    for line in lines:
        if not out or out[-1].casefold() != line.casefold():
            out.append(line)

    result = "\n".join(out).strip()
    if len(result) > max_len:
        result = result[: max_len - 1].rsplit(" ", 1)[0] + "…"
    return result


# ---------------------------------------------------------------
# Fayl nomi
# ---------------------------------------------------------------

RE_UNSAFE_NAME = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def split_ext(name: str) -> tuple[str, str]:
    """'kitob.pdf' -> ('kitob', '.pdf') ; 'noext' -> ('noext', '')"""
    if "." in name[1:]:
        stem, _, ext = name.rpartition(".")
        return stem, "." + ext
    return name, ""


def clean_filename(name: str | None, fallback_ext: str = "") -> str:
    """
    Fayl nomidan manba izini (@kanal, t.me) olib tashlaydi.

    ⚠️ Ma'noli nom qolmasa BO'SH satr qaytaradi — "file.pdf" kabi
    ma'nosiz nom o'ylab topmaydi. Bu holatda `build_filename()` sarlavhadan
    nom yasaydi. Sabab: manba nomini "qutqarishga" urinish kanal nomini
    olib qolish xavfini tug'diradi.
    """
    if not name:
        return ""

    name = unicodedata.normalize("NFKC", name).translate(INVISIBLE)
    stem, ext = split_ext(name)
    ext = ext or fallback_ext

    stem = RE_TG_LINK.sub(" ", stem)
    stem = RE_TG_PROTO.sub(" ", stem)
    stem = RE_MENTION.sub(" ", stem)
    stem = RE_UNSAFE_NAME.sub("", stem)
    stem = re.sub(r"[_\s]{2,}", " ", stem).strip(" _-.")

    # Kamida 2 ta harf/raqam qolishi kerak
    if len(re.sub(r"\W", "", stem)) < 2:
        return ""
    return (stem[:120] + ext)[:180]


def build_filename(original: str | None, title: str, ext: str = "") -> str:
    """
    Yuklash uchun yakuniy fayl nomi.
    1) tozalangan asl nom  →  2) sarlavhadan yasalgan nom  →  3) 'fayl'
    """
    cleaned = clean_filename(original, ext)
    if cleaned:
        return cleaned

    if not ext and original:
        ext = split_ext(original)[1]

    # clean_caption butunlay bo'sh qaytarishi mumkin (masalan sarlavha faqat @mention bo'lsa)
    cleaned_lines = clean_caption(title, max_len=100).splitlines()
    stem = RE_UNSAFE_NAME.sub("", cleaned_lines[0] if cleaned_lines else "")
    stem = re.sub(r"[_\s]{2,}", " ", stem).strip(" _-.")
    if len(re.sub(r"\W", "", stem)) < 2:
        stem = "fayl"
    return (stem[:120] + ext)[:180]


# ---------------------------------------------------------------
# Sarlavha (title) — caption yoki fayl nomidan
# ---------------------------------------------------------------

def derive_title(caption: str, filename: str, max_len: int = 200) -> str:
    """Katalog uchun sarlavha: caption birinchi qatori, bo'lmasa fayl nomi."""
    if caption:
        first = caption.splitlines()[0].strip()
        if len(first) >= 3:
            return first[:max_len]
    stem = filename.rsplit(".", 1)[0] if "." in filename[1:] else filename
    return (stem.replace("_", " ").strip() or "Nomsiz")[:max_len]


# ---------------------------------------------------------------
# Tez test:  python bot/clean.py
# ---------------------------------------------------------------
if __name__ == "__main__":
    SAMPLES = [
        (
            "Anatomiya atlasi 2024\n\n"
            "📚 Batafsil: @med_kanal\n"
            "Obuna bo'ling: https://t.me/med_kanal\n"
            "➖➖➖➖➖➖\n"
            "#kanal #reklama",
            "Anatomiya atlasi 2024",
        ),
        (
            "Подписывайтесь на наш канал!\nФармакология — лекции\nПо вопросам: @admin_bot",
            "Фармакология — лекции",
        ),
        ("@onlykanal", ""),
        ("", ""),
        (None, ""),
    ]
    ok = True
    print("clean_caption:")
    for src, want in SAMPLES:
        got = clean_caption(src)
        mark = "✅" if got == want else "❌"
        if got != want:
            ok = False
        print(f"  {mark} {str(src)[:40]!r:44} -> {got!r}")

    print("\nclean_filename (ma'nosiz bo'lsa bo'sh qaytaradi):")
    for src, want in [
        ("Anatomiya @med_kanal.pdf", "Anatomiya.pdf"),
        ("t.me/xchannel_kitob.epub", ""),      # butunlay havola -> bo'sh
        ("@med_kanal.pdf", ""),
        ("bad/name:file.zip", "badnamefile.zip"),
        ("", ""),
        ("noext", "noext"),
    ]:
        got = clean_filename(src)
        mark = "✅" if got == want else "❌"
        if got != want:
            ok = False
        print(f"  {mark} {src!r:30} -> {got!r}")

    print("\nbuild_filename (sarlavhadan zaxira nom):")
    for orig, title, want in [
        ("Anatomiya @med_kanal.pdf", "Anatomiya atlasi", "Anatomiya.pdf"),
        ("t.me/xchannel.epub", "Farmakologiya asoslari", "Farmakologiya asoslari.epub"),
        ("@kanal.pdf", "@onlymention", "fayl.pdf"),
        (None, "Ichki kasalliklar", "Ichki kasalliklar"),
    ]:
        got = build_filename(orig, title)
        mark = "✅" if got == want else "❌"
        if got != want:
            ok = False
        print(f"  {mark} ({orig!r}, {title!r}) -> {got!r}")

    print("\nderive_title:")
    for cap, fn, want in [
        ("Anatomiya atlasi", "x.pdf", "Anatomiya atlasi"),
        ("", "Farmakologiya_2024.pdf", "Farmakologiya 2024"),
        ("", "", "Nomsiz"),
    ]:
        got = derive_title(cap, fn)
        mark = "✅" if got == want else "❌"
        if got != want:
            ok = False
        print(f"  {mark} ({cap!r}, {fn!r}) -> {got!r}")

    print("\n" + ("✅ HAMMASI O'TDI" if ok else "❌ XATOLAR BOR"))
    raise SystemExit(0 if ok else 1)

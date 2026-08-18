"""
Analiz agenti — har bir faylni avtomatik tasniflaydi.

Kirish : fayl nomi, tozalangan caption, manba kanalda joylangan sana, kengaytma
Chiqish: sarlavha, tur, til, yil, kategoriyalar, qaysi kanalga tushishi, ishonch darajasi

Qoidaga asoslangan — pulsiz, tez, oldindan aytib bo'ladigan. Keyinchalik
noaniq holatlar uchun LLM qo'shish mumkin (`needs_review` bayrog'i shuning uchun).

Test: python bot/analyze.py
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime

# ---------------------------------------------------------------
# Kengaytma -> tur
# ---------------------------------------------------------------
KIND_BY_EXT = {
    "pdf": "book", "epub": "book", "djvu": "book", "fb2": "book", "mobi": "book",
    "mp4": "video", "mkv": "video", "avi": "video", "webm": "video", "mov": "video",
    "mp3": "audio", "m4a": "audio", "ogg": "audio", "wav": "audio", "opus": "audio",
    "apk": "app", "exe": "app", "msi": "app", "dmg": "app", "ipa": "app",
    "zip": "archive", "rar": "archive", "7z": "archive",
    "doc": "doc", "docx": "doc", "ppt": "doc", "pptx": "doc",
    "xls": "doc", "xlsx": "doc", "txt": "doc",
    "jpg": "image", "jpeg": "image", "png": "image", "webp": "image",
}

# ---------------------------------------------------------------
# Mavzu kalit so'zlari: slug -> (uz/ru/en naqshlar)
# Naqshlar o'zak bo'yicha — "anatomiya", "anatomik", "анатомия" hammasi tushadi.
# ---------------------------------------------------------------
TOPICS: dict[str, tuple[str, ...]] = {
    "anatomiya":      ("anatomi", "анатом", "anatomy", "skelet", "скелет", "mushak", "мышц"),
    "fiziologiya":    ("fiziolog", "физиолог", "physiol"),
    "biokimyo":       ("biokim", "биохим", "biochem"),
    "gistologiya":    ("gistolog", "гистолог", "histolog"),
    "mikrobiologiya": ("mikrobiolog", "микробиол", "microbiol", "bakteriolog", "бактериол"),
    "patologiya":     ("patolog", "патолог", "patholog"),
    "farmakologiya":  ("farmakolog", "фармакол", "pharmacol", "dorishunos", "препарат"),
    "terapiya":       ("terapiy", "терапи", "therap", "ichki kasallik", "внутренн болезн"),
    "jarrohlik":      ("jarroh", "хирург", "surgery", "surgical", "operatsiya"),
    "pediatriya":     ("pediatr", "педиатр", "bolalar kasallik", "детск болезн"),
    "ginekologiya":   ("ginekolog", "гинеколог", "akusher", "акушер", "obstetric"),
    "nevrologiya":    ("nevrolog", "невролог", "neurolog", "asab kasallik"),
    "kardiologiya":   ("kardiolog", "кардиолог", "cardiolog", "yurak", "сердц"),
    "stomatologiya":  ("stomatolog", "стоматолог", "dental", "tish kasallik", "зубн"),
    "oftalmologiya":  ("oftalmolog", "офтальмолог", "ophthalm", "ko'z kasallik"),
    "dermatologiya":  ("dermatolog", "дерматолог", "teri kasallik", "кожн болезн"),
    "psixiatriya":    ("psixiatr", "психиатр", "psychiatr", "ruhiy kasallik"),
    "radiologiya":    ("radiolog", "рентген", "radiolog", "mrt", "кт диагност", "uzi"),
    "travmatologiya": ("travmatolog", "травматолог", "trauma", "ortoped", "ортопед"),
    "onkologiya":     ("onkolog", "онколог", "oncolog", "rak kasallig", "опухол"),
    "infeksiya":      ("infeksion", "инфекцион", "infectious", "yuqumli"),
    "urologiya":      ("urolog", "уролог"),
    "endokrinologiya": ("endokrinolog", "эндокринолог", "diabet", "диабет"),
}

# Meditsinaga umuman tegishlimi?
MED_HINTS = (
    "tibbiy", "tibbiyot", "meditsina", "медицин", "medical", "medicine",
    "kasallik", "болезн", "shifokor", "врач", "doctor", "klinik", "клинич",
    "davolash", "лечени", "diagnostik", "диагност", "simptom", "симптом",
    "bemor", "пациент", "sindrom", "синдром", "retsept", "рецепт",
)

# Ilova/dastur belgilari
APP_HINTS = (
    "windows", "android", "ios", "macos", "linux", "crack", "kryak", "mod",
    "premium", "pro version", "aktivator", "активатор", "vpn", "antivirus",
    "driver", "драйвер", "utilit", "утилит", "portable",
)

# Darslik/qo'llanma turi
FORM_HINTS = {
    "darslik":   ("darslik", "учебник", "textbook", "uchebnik"),
    "atlas":     ("atlas", "атлас"),
    "qollanma":  ("qo'llanma", "qollanma", "пособие", "руководство", "handbook", "manual"),
    "maruza":    ("ma'ruza", "maruza", "лекци", "lecture"),
    "test":      ("test", "тест", "savol", "вопрос", "quiz"),
    "referat":   ("referat", "реферат"),
}

# (?<!\d)…(?!\d) — "\b" ishlatib bo'lmaydi: "_2021" da pastki chiziq ham
# word char, shuning uchun chegara hosil bo'lmaydi.
RE_YEAR = re.compile(r"(?<!\d)(19[5-9]\d|20[0-4]\d)(?!\d)")
RE_CYRILLIC = re.compile(r"[Ѐ-ӿ]")
RE_LATIN = re.compile(r"[A-Za-z]")
UZ_MARKERS = (
    "kasallik", "darslik", "kitob", "qo'llanma", "qollanma", "uchun", "haqida",
    "bo'yicha", "boyicha", "tibbiyot", "shifokor", "bemor", "ma'ruza", "savol",
    "yangi", "to'plam", "toplam", "asoslari", "nazariya", "versiya", "dastur",
    "amaliy", "nazariy", "to'liq", "toliq", "bilan", "hamda",
)

# O'zbek qo'shimchalari — qisqa fayl nomida eng ishonchli belgi.
# "atlasi", "kasalliklari", "shifokorlik" kabi so'zlarni tutadi.
UZ_SUFFIX = re.compile(
    r"\b\w{3,}?(?:lari(?:da|ning)?|larni|ning|dagi|asi|isi|uvchi|chilik|shunos)\b"
)

# Ingliz tili uchun ijobiy dalil — bo'lmasa "unknown" qaytadi.
EN_WORDS = (
    "the", "and", "for", "with", "guide", "book", "edition", "manual",
    "file", "video", "lecture", "course", "free", "full", "download",
    "windows", "android", "version", "premium", "crack", "portable",
)


@dataclass
class Analysis:
    title: str
    kind: str                                   # book|video|app|audio|doc|archive|image|file
    lang: str                                   # uz|ru|en|unknown
    year: int | None
    form: str | None                            # darslik|atlas|maruza|...
    categories: list[str] = field(default_factory=list)
    target_topic: str = "boshqa"                # medicina|apps|kitob|boshqa
    posted_at: datetime | None = None
    confidence: float = 0.0                     # 0.0 – 1.0
    needs_review: bool = True
    reasons: list[str] = field(default_factory=list)

    def summary(self) -> str:
        cats = ",".join(self.categories) or "—"
        return (f"{self.target_topic:>8} | {self.kind:>7} | {self.lang} | "
                f"{self.year or '----'} | {self.confidence:.2f} | {cats}")


def detect_lang(text: str) -> str:
    if not text.strip():
        return "unknown"
    cyr = len(RE_CYRILLIC.findall(text))
    lat = len(RE_LATIN.findall(text))
    if cyr > lat:
        return "ru"
    if lat == 0:
        return "unknown"
    low = text.casefold()
    # o' / g' digraflari — harfdan KEYIN apostrof kelishi shart.
    # Eski versiya [o'g'…] sinfi bo'lgani uchun "random" dagi oddiy "o" ni ham tutardi.
    if (any(m in low for m in UZ_MARKERS)
            or re.search(r"[og][’'`ʻ‘]", low)
            or UZ_SUFFIX.search(low)):
        return "uz"
    # Ingliz uchun ham IJOBIY dalil talab qilamiz — aks holda taxmin qilmaymiz.
    if any(re.search(rf"\b{w}\b", low) for w in EN_WORDS):
        return "en"
    return "unknown"


def analyze(
    *,
    filename: str = "",
    caption: str = "",
    ext: str = "",
    posted_at: datetime | None = None,
    source_topic: str | None = None,
) -> Analysis:
    """
    source_topic — manba kanal qaysi mavzuda ekani ('medicina'/'apps').
    Berilsa, ishonch darajasini oshiradi.
    """
    ext = (ext or "").lstrip(".").lower()
    blob = f"{filename} {caption}".casefold()
    reasons: list[str] = []

    # --- Tur ---
    kind = KIND_BY_EXT.get(ext, "file")

    # --- Til ---
    lang = detect_lang(f"{filename} {caption}")

    # --- Yil ---
    years = [int(y) for y in RE_YEAR.findall(re.sub(r"[_\-]", " ", f"{filename} {caption}"))]
    year = max(years) if years else None

    # --- Shakl (darslik/atlas/ma'ruza) ---
    form = None
    for name, pats in FORM_HINTS.items():
        if any(p in blob for p in pats):
            form = name
            reasons.append(f"shakl: {name}")
            break

    # --- Mavzular ---
    cats: list[str] = []
    for slug, pats in TOPICS.items():
        if any(p in blob for p in pats):
            cats.append(slug)
    if cats:
        reasons.append(f"mavzu: {', '.join(cats)}")

    med_score = sum(1 for h in MED_HINTS if h in blob)
    app_score = sum(1 for h in APP_HINTS if h in blob)

    # --- Qaysi kanalga ---
    score = 0.0
    if cats:
        target = "medicina"
        score = 0.85
        reasons.append("aniq tibbiy mavzu topildi")
    elif med_score >= 2:
        target = "medicina"
        score = 0.65
        reasons.append(f"tibbiy so'zlar: {med_score} ta")
    elif app_score >= 1 and kind in ("app", "archive"):
        target = "apps"
        score = 0.75
        reasons.append(f"ilova belgilari: {app_score} ta")
    elif kind == "app":
        target = "apps"
        score = 0.6
        reasons.append("kengaytma ilovaga xos")
    elif med_score == 1:
        target = "medicina"
        score = 0.45
        reasons.append("bitta tibbiy so'z — zaif belgi")
    else:
        target = source_topic or "boshqa"
        score = 0.3 if source_topic else 0.15
        reasons.append("aniq belgi yo'q — manba kanal mavzusi olindi"
                       if source_topic else "tasniflab bo'lmadi")

    # Manba kanal mavzusi mos kelsa — ishonch oshadi
    if source_topic and target == source_topic:
        score = min(1.0, score + 0.10)
        reasons.append("manba kanal mavzusi bilan mos")
    elif source_topic and target != source_topic and score < 0.7:
        score = max(0.0, score - 0.15)
        reasons.append("⚠️ manba kanal mavzusiga zid")

    # Qo'shimcha kategoriyalar
    if kind in ("book", "video", "audio") and target == "medicina":
        cats.append({"book": "kitob", "video": "video", "audio": "audio"}[kind])
    if form:
        cats.append(form)

    # --- Sarlavha ---
    title = (caption.splitlines()[0].strip() if caption.strip()
             else re.sub(r"[_]+", " ", filename.rsplit(".", 1)[0]).strip())
    title = re.sub(r"\s{2,}", " ", title)[:200] or "Nomsiz"

    return Analysis(
        title=title,
        kind=kind,
        lang=lang,
        year=year,
        form=form,
        categories=sorted(set(cats)),
        target_topic=target,
        posted_at=posted_at,
        confidence=round(score, 2),
        needs_review=score < 0.6,
        reasons=reasons,
    )


# ---------------------------------------------------------------
if __name__ == "__main__":
    CASES = [
        dict(filename="Anatomiya atlasi Sinelnikov 2019.pdf", caption="", ext="pdf",
             expect=("medicina", "book", "uz", 2019, "anatomiya")),
        dict(filename="lekciya_farmakologiya.mp4",
             caption="Фармакология — лекция 5. Антибиотики", ext="mp4",
             expect=("medicina", "video", "ru", None, "farmakologiya")),
        dict(filename="v2rayN-windows-64.zip", caption="VPN dasturi windows uchun",
             ext="zip", expect=("apps", "archive", "uz", None, None)),
        dict(filename="Pediatriya_darslik_2021.pdf", caption="Bolalar kasalliklari darsligi",
             ext="pdf", expect=("medicina", "book", "uz", 2021, "pediatriya")),
        dict(filename="random_file.bin", caption="", ext="bin",
             expect=("boshqa", "file", "unknown", None, None)),  # dalil yo'q -> taxmin qilmaymiz
        dict(filename="Kardiologiya.  Yurak kasalliklari 2023.djvu", caption="",
             ext="djvu", expect=("medicina", "book", "uz", 2023, "kardiologiya")),
        dict(filename="Photoshop_2024_crack.exe", caption="Premium versiya aktivator",
             ext="exe", expect=("apps", "app", "uz", 2024, None)),
    ]

    ok = True
    print(f"{'FAYL':<44} {'KANAL':>9} | {'TUR':>7} | TIL | YIL  | ISHONCH | KATEGORIYALAR")
    print("─" * 118)
    for c in CASES:
        exp = c.pop("expect")
        a = analyze(**c)
        want_t, want_k, want_l, want_y, want_cat = exp
        good = (a.target_topic == want_t and a.kind == want_k
                and a.lang == want_l and a.year == want_y
                and (want_cat is None or want_cat in a.categories))
        if not good:
            ok = False
        print(f"{'✅' if good else '❌'} {c['filename'][:41]:<41} {a.summary()}")
        if not good:
            print(f"   kutilgan: {exp}")

    print("\nKo'rib chiqish kerak (confidence < 0.6):")
    for c in CASES:
        a = analyze(**c)
        if a.needs_review:
            print(f"   ⚠️  {c['filename'][:50]} — {a.reasons[-1]}")

    print("\n" + ("✅ HAMMASI O'TDI" if ok else "❌ XATOLAR BOR"))
    raise SystemExit(0 if ok else 1)

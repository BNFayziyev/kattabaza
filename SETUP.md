# KattaBaza — qadam-baqadam sozlash

> Hech qanday oldingi tajriba talab qilinmaydi. Har qadamdan keyin
> "✅ Tekshirish" bo'limi bor — o'sha ishlagach keyingisiga o'ting.

---

# 1-QISM. Ma'lumotlar bazasi (Supabase)

**Ma'lumotlar bazasi nima?** Excel jadvaliga o'xshaydi, lekin million qatorni
ko'tara oladi va bir vaqtda bot ham, sayt ham unga yoza oladi. Bizniki —
**Postgres**, uni **Supabase** bepul beradi.

## 1.1. Ro'yxatdan o'tish

1. [supabase.com](https://supabase.com) → **Start your project**
2. GitHub akkauntingiz bilan kiring
3. **New project** tugmasi

## 1.2. Loyiha yaratish

| Maydon | Nima yozish |
|---|---|
| **Name** | `kattabaza` |
| **Database Password** | Tugmani bosib avtomatik yaratdiring |
| **Region** | `Central EU (Frankfurt)` |
| **Plan** | `Free` |

> ⚠️ **Database Password** ni darhol nusxalab, parol menejeringizga saqlang.
> U boshqa ko'rsatilmaydi. Chatga yozmang.

**Create new project** → 2–3 daqiqa kutasiz.

**✅ Tekshirish:** yuqorida yashil "Project is healthy" yozuvi paydo bo'ldi.

## 1.3. Jadvallarni yaratish

Bu yerda `db/schema.sql` faylidagi buyruqlarni bajaramiz — u jadvallarni,
indekslarni va qidiruv funksiyasini yaratadi.

1. Chap menyudan **SQL Editor** (📄 belgisi)
2. **New query**
3. Kompyuteringizda `D:\kattabaza-main\db\schema.sql` faylini **Notepad** bilan oching
4. `Ctrl+A` → `Ctrl+C` (hammasini nusxalash)
5. Supabase'dagi oynaga `Ctrl+V`
6. Pastdagi **Run** tugmasi (yoki `Ctrl+Enter`)

Pastda `Success. No rows returned` chiqishi kerak.

Endi **xuddi shu narsani** `db/keys_security.sql` uchun takrorlang:
**New query** → paste → **Run**.

**✅ Tekshirish:** chap menyudan **Table Editor** → 9 ta jadval ko'rinishi kerak:
`materials`, `channels`, `categories`, `material_categories`, `jobs`,
`downloads`, `access_keys`, `app_secrets`, `access_attempts`.

## 1.4. Kalitlar paroli

SQL Editor'da yangi query:

```sql
select set_keys_password('BU_YERGA_O_ZINGIZ_PAROL_YOZING');
```

Parol kamida 16 belgi, tasodifiy bo'lsin. **Parol menejeriga saqlang.**

**✅ Tekshirish:**

```sql
select unlock_keys('BU_YERGA_O_ZINGIZ_PAROL_YOZING', 'test');
```

`{"ok": true, "keys": []}` chiqsa — ishladi. (`keys` bo'sh, chunki hali
kalit qo'shmadik.)

```sql
select unlock_keys('xato-parol', 'test');
```

`{"ok": false, "reason": "invalid_password", ...}` chiqishi kerak.

## 1.5. Ulanish ma'lumotlarini olish

Uchta narsa kerak. Har birini `.env` faylingizga yozasiz.

**a) DATABASE_URL** (bot uchun)

**Settings** (⚙️) → **Database** → **Connection string** → **URI** yorlig'i.
Nusxalang. `[YOUR-PASSWORD]` o'rniga 1.2-qadamdagi parolni qo'ying.

**b) VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY** (sayt uchun)

**Settings** → **API** → `Project URL` va `anon` `public` kaliti.

> `anon` kalit brauzerda ochiq bo'ladi — bu **normal**. Himoyani RLS beradi.
> `service_role` kalitini esa **hech qachon** saytga qo'ymang.

## 1.6. `.env` faylini yaratish

`D:\kattabaza-main` papkasida `.env.example` faylidan nusxa oling va nomini
`.env` qiling. Ichini to'ldiring:

```
DATABASE_URL=postgresql://postgres.xxxx:PAROL@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

TG_API_ID=<yangi raqamdan olingan>
TG_API_HASH=<yangi raqamdan olingan>
```

> `.gitignore` da `.env` bor — GitHub'ga hech qachon tushmaydi. Tekshirilgan.

**✅ Tekshirish:**

```
cd D:\kattabaza-main
python -m bot.config
```

`✅ Sozlamalar to'liq` chiqishi kerak.

---

# 2-QISM. Cloudflare R2 — hozircha to'xtang

Siz `kattabaza` bucket ochib, API kalitlarini oldingiz. **Yetarli.**

**Domen muammosi:** R2 ga o'z domeningizni (`cdn.kattabaza.uz`) ulash uchun
domen DNS'i Cloudflare'da bo'lishi kerak. Sizniki Vercel'da.

**Hozir buni hal qilish SHART EMAS.** R2 birinchi bosqichda umuman
ishlatilmaydi — fayllar Telegramda yotadi. Keyinroq, preview rasmlar
kerak bo'lganda ikkita yo'l bor:

| Yo'l | Qanday |
|---|---|
| **A (tavsiya)** | DNS'ni Cloudflare'ga ko'chirish. Vercel ishlashda davom etadi — `kattabaza.uz` uchun Vercel bergan yozuvni Cloudflare'ga qo'yasiz ("DNS only" rejimida), `cdn.kattabaza.uz` esa R2 ga ketadi. |
| **B** | Vaqtincha `r2.dev` manzilini ishlatish. Bepul, lekin sekin va production uchun emas. |

Buni preview'lar kerak bo'lganda birga qilamiz. Hozir o'tkazib yuboring.

---

# 3-QISM. Userbot

`bot/README.md` ga qarang. Qisqacha:

```
cd D:\kattabaza-main
python -m venv .venv
.venv\Scripts\activate
pip install -r bot\requirements.txt
python -m bot.config
```

Keyin yangi kanalingizni oching, userbot akkauntini **admin** qiling va:

```
python -m bot.mirror @manba_kanal --to @yangi_kanalim --topic medicina --limit 20 --dry-run
```

---

# Tez-tez beriladigan savollar

### Har bir kanal uchun alohida bot kerakmi?

**Yo'q.** Boshida shunday rejalashtirgandim, lekin arxitektura o'zgargach
bu keraksiz bo'lib qoldi.

Ko'chirishni **userbot** qiladi — u bitta, va u istalgan kanalga yoza oladi
(admin bo'lsa yetarli). Alohida bot faqat kelajakda kerak bo'ladi:

- foydalanuvchi saytdan "Telegramda yuklab olish" bosganda fayl yuborish
- kanalning ommaviy "murojaat uchun" boti

Ikkalasi ham **bitta bot** bilan hal bo'ladi. Hozir umuman kerak emas.

### Katta fayllarni kanalga joylasak, joyimiz tez to'lmaydimi?

Yo'q. Uchta alohida joy bor, ularni aralashtirmaslik kerak:

| Qayerda | Nima yotadi | Chegara | Narx |
|---|---|---|---|
| **Telegram** | Barcha fayllar (asosiy ombor) | Cheksiz, 2 GB/fayl | **$0** |
| **Cloudflare R2** | Faqat preview rasmlar (~50 KB) va kichik PDF'lar | 10 GB bepul | ~$0 |
| **Kompyuteringiz** | Vaqtinchalik — bitta fayl | — | — |

**Telegram cheksiz va bepul.** 10 000 ta video joylasangiz ham $0 to'laysiz.

R2 ga faqat kichik preview rasmlar tushadi:
10 000 fayl × 50 KB = **500 MB** — bepul limitning 5% i.

Kompyuteringizda fayl **vaqtincha** turadi: yuklab olinadi → kanalga yuklanadi →
**darhol o'chiriladi** (`mirror.py` dagi `shutil.rmtree`). Ya'ni diskda bir
vaqtning o'zida faqat bitta fayl bo'ladi.

**Yagona haqiqiy xarajat — internet trafigi.** 100 GB kontent ko'chirsangiz,
100 GB yuklab olib, 100 GB yuklaysiz.

### Fayllar to'g'ri joyga tushishiga kim qaror qiladi?

`bot/analyze.py` — analiz agenti. Har fayl uchun quyidagilarni aniqlaydi:

- **kategoriya** — anatomiya, farmakologiya, pediatriya… (23 ta yo'nalish)
- **tur** — kitob, video, ilova, audio
- **til** — uz / ru / en
- **yil** — nom yoki izohdan
- **shakl** — darslik, atlas, ma'ruza, test
- **qaysi kanalga** — medicina yoki apps
- **ishonch darajasi** — 0.00 dan 1.00 gacha

Ishonch **0.60 dan past** bo'lsa, fayl `needs_review = true` deb belgilanadi —
ya'ni "men ishonchim komil emas, o'zing ko'r". Ularni ko'rish:

```sql
select id, title, confidence, form, lang_detected
from materials where needs_review order by confidence;
```

Kanaldagi va saytdagi **tartib** `source_posted_at` bo'yicha — ya'ni fayl
**manba kanalda qachon joylangan** bo'lsa, o'sha tartibda. Nusxa olingan
sana bo'yicha emas. Shuning uchun ko'chirish eski postdan yangisiga qarab boradi.

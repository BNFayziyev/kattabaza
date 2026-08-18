# KattaBaza userbot — ishga tushirish

## Nima qiladi

Manba kanaldan fayllarni **yuklab oladi**, manba izlarini **tozalaydi** va
sizning kanalingizga **qayta yuklaydi**.

`forward` ham, `copyMessage` ham ishlatilmaydi — shuning uchun manba kanal
yoki post o'chirilsa ham sizning nusxangiz saqlanib qoladi.

**Tozalanadigan narsalar:** "Forwarded from" yozuvi, caption dagi `@mention`
va `t.me/…` havolalar, "obuna bo'ling" chaqiriqlari, fayl nomidagi kanal nomi,
manba thumbnail'i (vodiy belgisi bo'lishi mumkin).

Manba kanal nomi **bazada** saqlanadi (kanal biosiga ro'yxat yozishingiz uchun),
lekin **postlarga chiqmaydi**.

---

## 1. Tayyorgarlik

```bash
cd D:\kattabaza-main
python -m venv .venv
.venv\Scripts\activate
pip install -r bot\requirements.txt
```

`.env` faylini yarating (`.env.example` dan nusxa oling) va to'ldiring:

```
TG_API_ID=...          # my.telegram.org -> API development tools
TG_API_HASH=...
DATABASE_URL=...       # Supabase -> Settings -> Database -> URI
```

Sozlamalarni tekshiring:

```bash
python -m bot.config
```

---

## 2. Birinchi ishga tushirish

Birinchi marta Telegram telefon raqam va kod so'raydi. Kod kiritilgach
`kattabaza_userbot.session` fayli yaratiladi — **bu fayl parolga teng,
hech kimga bermang, git'ga qo'shmang** (`.gitignore` da allaqachon bor).

---

## 3. Ko'chirish

```bash
# a) AVVAL ko'ring — hech nima ko'chmaydi, faqat ro'yxat
python -m bot.mirror @manba_kanal --to @mening_kanalim --limit 20 --dry-run

# b) Kichik test — 5 ta fayl
python -m bot.mirror @manba_kanal --to @mening_kanalim --limit 5 --topic medicina

# c) To'liq
python -m bot.mirror @manba_kanal --to @mening_kanalim --topic medicina
```

| Parametr | Ma'nosi |
|---|---|
| `--dry-run` | Hech nima ko'chirmaydi, faqat ko'rsatadi |
| `--limit N` | N ta fayldan keyin to'xtaydi |
| `--type` | `all`, `video`, `book`, `app`, `photo`, `document` |
| `--topic` | Kategoriya slug: `medicina`, `kitob`, `apps` |
| `--no-resume` | Boshidan boshlaydi (odatda kerak emas) |

**Uzilib qolsa** — xuddi shu buyruqni qayta bering. Qayerda to'xtagani
`channels.last_synced_msg_id` da saqlanadi, ikki marta ko'chirmaydi.

---

## 4. Nimaga e'tibor berish kerak

**Ban riski.** Bu sizning shaxsiy Telegram akkauntingiz nomidan ishlaydi.

- Asosiy raqamingizni ishlatmang — alohida SIM oling.
- `COPY_DELAY_SECONDS` ni 1.5 dan pasaytirmang.
- Birinchi kuni 50–100 fayldan oshirmang, keyin asta oshiring.
- `FloodWait` chiqsa skript o'zi kutadi — to'xtatmang.

**Tezlik.** Har fayl to'liq yuklab olinadi va qayta yuklanadi.
100 ta × 100 MB ≈ 10 GB pastga + 10 GB yuqoriga. Yaxshi internet kerak.
1000 ta fayl bir necha kun davom etishi mumkin — bu normal.

**Nusxalash taqiqlangan kanallar.** Ba'zi kanallarda "Restrict saving content"
yoqilgan. Ulardan yuklab bo'lmaydi — skript `🔒` belgisi bilan o'tkazib yuboradi.

**Maqsad kanal.** Userbot akkaunti u yerda **admin** bo'lishi va "Post messages"
huquqi bo'lishi shart.

---

## 5. Manbalar ro'yxatini olish (kanal biosi uchun)

```sql
select coalesce(ch.username, m.source_chat_id::text) as manba,
       ch.title, count(*) as materiallar
from materials m
left join channels ch on ch.tg_chat_id = m.source_chat_id
where m.source_chat_id is not null
group by 1, 2 order by materiallar desc;
```

---

## Fayllar

| Fayl | Vazifasi |
|---|---|
| `config.py` | `.env` dan sozlamalar |
| `clean.py` | Caption va fayl nomini tozalash (o'z testi bor: `python bot/clean.py`) |
| `db.py` | Postgres: dublikat nazorati, material yozish, progress |
| `mirror.py` | Asosiy ko'chirish dvigateli |

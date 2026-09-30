# KattaBaza

Dasturlar, VPN va servislar markazi — `kattabaza.uz`.
Sayt shu kompyuterda ishlaydi, internetga **Cloudflare Tunnel** orqali chiqadi.

```
Brauzer ──► Cloudflare ──► cloudflared (shu kompyuter) ──► http://127.0.0.1:3000 (server/index.js)
                                                              ├─ dist/   — sayt (React + Vite)
                                                              └─ /api/*  — katalog, IP qidiruv, kalitlar
```

Supabase, userbot va migratsiya bo'yicha qo'llanma — [SETUP.md](SETUP.md).

## Bosh sahifa

- Orqa fonda Leaflet xaritasi — foydalanuvchi joylashuvida pulsli belgi.
- "Your connection" kartasi (bayroq, IPv4/IPv6, provayder, ⓘ — barcha ma'lumot).
- **IP qidiruv** — istalgan IP yoki domen: joylashuv, vaqt zonasi, ISP, ASN, rDNS va h.k.;
  topilgan joyga orqa fondagi xarita uchib boradi.
- Ilova qidiruvi; bo'sh bo'lsa — 2 ustunli bloklar (kichik ekranda 1 ustun):
  **Ilovalar**, **Time**, **Treyler**, **Med** (karusel rasmlari bilan).
- Chap menyu: bo'limlar, kanallar, servislar (time, treyler, camera, med), admin va kalitlar,
  mavzu, til (EN / UZ / RU).
- O'ng panel: **AI yordamchi** — xabar Telegramda `@synapse_bo1` ga ochiladi.

Tarjimalar: `src/lib/i18n.js`. Servislar ro'yxati (yangi subdomen shu yerga): `src/lib/site.js`.

## Ishga tushirish

Node.js 22+ kerak.

```powershell
npm install
npm run build      # saytni yig'ish -> dist/
npm start          # server: http://localhost:3000
```

Ishlab chiqish rejimi: `npm run dev` → http://localhost:5173 (API server bilan birga).

Server sozlamalari `.env` faylida (namuna: `.env.example`, "Lokal server" bo'limi).

### Kompyuter bilan birga avtomatik ishga tushirish

Administrator PowerShell'da:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1
```

`KattaBaza` nomli Windows vazifasi yaratiladi: kompyuter yoqilganda server ko'tariladi,
to'xtab qolsa 10 soniyada qayta ishga tushadi. Log: `data\server.log`.
Olib tashlash: `scripts\uninstall-autostart.ps1`.

## Kalitlar

- Parol **serverda** (`server/keys.js`) tekshiriladi, kalitlar faqat to'g'ri paroldan keyin keladi.
  Brauzerda na kalit, na parol formulasi, na Sheet ID bor.
- 10 daqiqada 8 tadan ortiq urinish — vaqtincha blok.
- `.env`: `KEYS_PASSWORD` (doimiy parol) yoki bo'sh qoldirilsa vaqtli parol
  (`KEYS_PASSWORD_PREFIX` + Toshkent vaqti + `KEYS_PASSWORD_OFFSET_MIN` daqiqa, ±1 daqiqa).
- `db/keys_security.sql` (Supabase varianti) keyinchalik bazaga o'tilganda ishlatiladi.

## Karusel rasmlari

`tools/slides/slides.html` — slaydlar manbasi. O'zgartirgandan keyin:

```powershell
npm run slides     # -> public/slides/*.png (Chrome yoki Edge kerak)
npm run build
```

## Cloudflare orqali domenga ulash

Hozir `kattabaza.uz` DNS'i **ahost.uz** da, sayt esa **Vercel** da. Bu kompyuterda
`cloudflared` servisi allaqachon o'rnatilgan va ishlab turibdi.

1. dash.cloudflare.com → *Add a domain* → `kattabaza.uz` (Free). Mavjud yozuvlar ko'chiriladi —
   bular albatta bo'lsin, **DNS only** (kulrang bulut):

   | Yozuv | Qiymat |
   |---|---|
   | `time` A | `24.123.34.242` |
   | `treyler` A | `24.123.34.243` |
   | `camera` A | `84.54.112.44` |

   `kattabaza.uz` va `www` ning Vercel yozuvlarini o'chiring.
2. **ahost.uz** panelida nameserver'larni Cloudflare bergan ikkita NS ga almashtiring.
3. Cloudflare → *Zero Trust* → *Networks* → *Tunnels* → shu kompyuterdagi tunnel →
   *Public Hostname* → `kattabaza.uz` va `www.kattabaza.uz` → `HTTP` `localhost:3000`.
4. Tekshirish: `https://kattabaza.uz/api/health` → `{"ok":true}`.

Ko'chishdan keyin: Vercel loyihasini o'chiring va `.env` da `KEYS_PASSWORD_OFFSET_MIN` ni
almashtiring (eski parol formulasi eski versiyalarda ochiq bo'lgan).

## Fayllar

```
server/            Node server (bog'liqliksiz): statik fayllar + /api
  sheets.js        Google Sheets (opensheet) + kesh (data/catalog-cache.json)
  keys.js          parol, kalitlar ro'yxati
  ip.js            IP/domen qidiruv (ipwho.is, zaxira: ipapi.co) + rDNS
src/
  components/      Sidebar, ConnectionCard, IpLookup, LocationMap, AppsBlock,
                   ServiceBlock, Carousel, AssistantPanel, KeysPanel, CheckerPanel, ...
  hooks/           useCatalogData, useIpInfo
  lib/             i18n, site (servislar), checker, supabase
public/slides/     karusel rasmlari
scripts/           dev.js, start.cmd, install-autostart.ps1
tools/slides/      slaydlar manbasi va PNG ga aylantirish
bot/, db/          userbot va Supabase sxemasi (SETUP.md)
```

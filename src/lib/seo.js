// Har sahifaning Google'dagi sarlavhasi va tavsifi.
// Server index.html ni berishdan oldin shularni joylaydi (Google darhol ko'radi),
// brauzerda esa sahifa almashganda App.jsx yangilaydi.

export const SITE = "https://kattabaza.uz";

export const PAGES = {
  "/": {
    title: "KattaBaza — Dasturlar Markazi",
    desc: "KattaBaza — dasturlar, VPN va ilovalarni xavfsiz yuklab olish markazi. FaceID davomat, treyler kuzatuvi, tibbiy AI prezentatsiya, raqamli vizitka, xavfsizlik tekshiruvi va MikroTik sozlash — hammasi bir joyda.",
  },
  "/apps": {
    title: "Ilovalar katalogi — KattaBaza",
    desc: "120+ dastur va ilova: VPN (v2rayN, Outline), AnyDesk, Winbox, tarmoq va Windows dasturlari. Tekshirilgan manbadan tez va xavfsiz yuklab oling.",
  },
  "/checker": {
    title: "Xavfsizlik tekshiruvi — KattaBaza",
    desc: "Pochta, domen yoki havolani firibgarlik va xavfga tekshiring: MX va DNS yozuvlari, SPF/DMARC, domen yoshi (WHOIS) va fishing belgilari — bepul.",
  },
  "/mikrotik": {
    title: "MikroTik sozlash — KattaBaza",
    desc: "MikroTik routerni noldan sozlash: PPPoE internet, Wi-Fi, DHCP, NAT va firewall — terminal buyruqlari va Winbox'dagi xuddi shu qadamlar bir joyda.",
  },
  "/mikrotik/faq": {
    title: "MikroTik savol-javoblar — KattaBaza",
    desc: "MikroTik bo'yicha ko'p beriladigan savollar va tez-tez uchraydigan muammolarning yechimi — oddiy tilda.",
  },
  "/time": {
    title: "KattaBaza Time — FaceID davomat platformasi",
    desc: "Yuz orqali davomat: kim ofisda, kim kechikdi — jonli kameralar, smenalar va Excel/PDF hisobotlar. Telegram orqali parolsiz kirish. time.kattabaza.uz",
  },
  "/treyler": {
    title: "Trailer Watch — Treyler kuzatuvi | KattaBaza",
    desc: "5 ta GPS provayderdagi barcha treylerlar bitta xaritada: uzoq turib qolganlari avtomatik aniqlanadi, Telegram'ga hisobot va ogohlantirishlar. treyler.kattabaza.uz",
  },
  "/med": {
    title: "KattaBaza Med — tibbiyot talabalari uchun AI prezentatsiya",
    desc: "Mavzuni yozing — AI tibbiy kutubxonadan manba topib, tayyor prezentatsiya (PPTX, PDF) yasaydi. Tibbiy kitoblar bazasi, jonli viktorina. med.kattabaza.uz",
  },
  "/vizitka": {
    title: "Vizitka — raqamli vizitka, QR kod va NFC | KattaBaza",
    desc: "Raqamli vizitka 2 daqiqada: profil-havola, QR kod, NFC karta, 24 ta dizayn shablon va bosma vizitka buyurtmasi. Telegram orqali kirish. vizitka.kattabaza.uz",
  },
  "/samsara": {
    title: "Samsara Wall — traklarning kamera devori | KattaBaza",
    desc: "Barcha Samsara traklarining yo'l kameralari bir ekranda: xaritada yo'l izi, Safety Inbox videolari va Telegram xabarnomalari. samsara.kattabaza.uz",
  },
  "/bot": {
    title: "BotChat — Telegram botlarini boshqarish | KattaBaza",
    desc: "Telegram botlaringizni bitta joyda boshqaring: xabarlarni o'qing va bot nomidan javob bering. Botlar soni cheklanmagan. bot.kattabaza.uz",
  },
  "/categories": {
    title: "Kategoriyalar — KattaBaza",
    desc: "KattaBaza'dagi barcha dasturlar va materiallar bo'limlar bo'yicha: VPN, tarmoq, ofis, multimedia va boshqalar.",
  },
  "/profile": {
    title: "Bobirjon Fayziyev — KattaBaza",
    desc: "KattaBaza muallifi bilan bog'lanish: Telegram, Instagram va Threads.",
  },
};

// /apps/vpn kabi ichki yo'llar — eng yaqin ota sahifa matni, manzil esa o'zi
export function pageMeta(pathname) {
  let p = (pathname || "/").replace(/\/+$/, "") || "/";
  if (p === "/home") p = "/";
  let key = p;
  while (!PAGES[key] && key !== "/") key = key.slice(0, key.lastIndexOf("/")) || "/";
  return { ...PAGES[key], url: SITE + p };
}

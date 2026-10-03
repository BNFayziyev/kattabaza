// Har sahifaning Google'dagi sarlavhasi va tavsifi.
// Server index.html ni berishdan oldin shularni joylaydi (Google darhol ko'radi),
// brauzerda esa sahifa almashganda App.jsx yangilaydi.

export const SITE = "https://kattabaza.uz";

export const PAGES = {
  "/": {
    title: "KattaBaza — Dasturlar Markazi",
    desc: "KattaBaza — dasturlar, VPN va ilovalarni xavfsiz yuklab olish markazi. FaceID davomat, treyler kuzatuvi, xavfsizlik tekshiruvi va MikroTik sozlash — hammasi bir joyda.",
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
    title: "KattaBaza Med — tibbiy servis (tez orada)",
    desc: "KattaBaza'ning yangi tibbiy servisi — med.kattabaza.uz. Hozir ishlab chiqilmoqda, tez orada ishga tushadi.",
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

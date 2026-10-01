// Subdomen servislar va AI yordamchi — sayt bo'ylab ishlatiladigan doimiy ma'lumotlar.

export const ASSISTANT_USERNAME = "synapse_bo1";

// Sayt egasi — profil sahifasi, "Admin va kalitlar" oynasi va footer shu yerdan oladi.
// Hamma tarmoqlarda nik bir xil (bobirjonfayziyev). Profilda faqat Telegram, Instagram, Threads.
const NICK = "bobirjonfayziyev";
export const OWNER = {
  name: "Bobirjon Fayziyev",
  handle: NICK,
  phone: "+998995267403",
  phoneDisplay: "+998 99 526 74 03",
  avatar: "https://github.com/BNFayziyev.png",
  telegram: `https://t.me/${NICK}`,
  // color — ikonka fonining brend rangi
  socials: [
    { id: "telegram", label: "Telegram", icon: "send", url: `https://t.me/${NICK}`, color: "bg-[#229ED9]" },
    { id: "instagram", label: "Instagram", icon: "instagram", url: `https://www.instagram.com/${NICK}/`, color: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]" },
    { id: "threads", label: "Threads", icon: "threads", url: `https://www.threads.com/@${NICK}`, color: "bg-[#111111]" },
  ],
};

// status: "live" — ishlayapti, "soon" — tez orada.  home: bosh sahifada blok bo'lib chiqadimi.
// slides: public/slides/<id>-<light|dark>.jpg — tools/slides/capture.mjs yaratadi.
export const SERVICES = [
  { id: "time", domain: "time.kattabaza.uz", status: "live", icon: "clock", home: true, slides: ["time-1", "time-2", "time-3", "time-4"] },
  { id: "treyler", domain: "treyler.kattabaza.uz", status: "live", icon: "truck", home: true, slides: ["treyler-1", "treyler-2", "treyler-3", "treyler-4"] },
  { id: "camera", domain: "camera.kattabaza.uz", status: "soon", icon: "camera", home: false, slides: [] },
  { id: "med", domain: "med.kattabaza.uz", status: "soon", icon: "pulse", home: true, slides: ["med-1", "med-2"] },
];

export const serviceUrl = (s) => `https://${s.domain}`;

export const slideUrl = (id, theme) => `/slides/${id}-${theme === "dark" ? "dark" : "light"}.jpg`;

export const telegramChatUrl = (text) =>
  `https://t.me/${ASSISTANT_USERNAME}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

// Subdomen servislar va AI yordamchi — sayt bo'ylab ishlatiladigan doimiy ma'lumotlar.

export const ASSISTANT_USERNAME = "synapse_bo1";

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

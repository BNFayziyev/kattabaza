// Subdomen servislar va AI yordamchi — sayt bo'ylab ishlatiladigan doimiy ma'lumotlar.

export const ASSISTANT_USERNAME = "synapse_bo1";

// status: "live" — ishlayapti, "soon" — tez orada.  home: bosh sahifada blok bo'lib chiqadimi.
export const SERVICES = [
  { id: "time", domain: "time.kattabaza.uz", status: "live", icon: "⏱️", home: true, slides: ["time-1", "time-2", "time-3", "time-4", "time-5"] },
  { id: "treyler", domain: "treyler.kattabaza.uz", status: "live", icon: "🚛", home: true, slides: ["treyler-1", "treyler-2", "treyler-3", "treyler-4"] },
  { id: "camera", domain: "camera.kattabaza.uz", status: "soon", icon: "📷", home: false, slides: [] },
  { id: "med", domain: "med.kattabaza.uz", status: "soon", icon: "🩺", home: true, slides: ["med-1", "med-2"] },
];

export const serviceUrl = (s) => `https://${s.domain}`;

export const telegramChatUrl = (text) =>
  `https://t.me/${ASSISTANT_USERNAME}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

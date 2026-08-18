import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * ⚠️ createClient("", "") XATO TASHLAYDI va butun sayt qulaydi.
 * .env hali to'ldirilmagan bo'lsa ham sayt ochilishi kerak (masalan
 * "Tekshiruv" bo'limi bazaga umuman bog'liq emas). Shuning uchun
 * sozlama yo'q bo'lsa — bo'sh natija qaytaradigan zaxira mijoz.
 */
function makeStub() {
  const empty = Promise.resolve({ data: [], error: null });
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    then: (res, rej) => empty.then(res, rej),
  };
  return {
    from: () => chain,
    rpc: () =>
      Promise.resolve({
        data: null,
        error: { message: "Supabase sozlanmagan (.env faylini to'ldiring)" },
      }),
  };
}

let client;
if (!url || !anonKey) {
  console.warn(
    "[KattaBaza] VITE_SUPABASE_URL yoki VITE_SUPABASE_ANON_KEY yo'q — " +
      "katalog bo'sh ko'rinadi. Tekshiruv bo'limi baribir ishlaydi."
  );
  client = makeStub();
} else {
  /**
   * anon kalit brauzerda ochiq bo'ladi — bu NORMAL.
   * Himoyani RLS beradi: `materials` dan faqat status='published' o'qiladi,
   * `access_keys` ga esa umuman policy yo'q (faqat unlock_keys RPC orqali).
   */
  client = createClient(url, anonKey, { auth: { persistSession: false } });
}

export const supabase = client;

/**
 * Barqaror, anonim mijoz identifikatori — faqat throttle uchun.
 * Shaxsni aniqlamaydi, serverga parol urinishlarini guruhlash uchun boradi.
 */
export function getClientId() {
  const KEY = "kb_cid";
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

-- ============================================================
-- KattaBaza — "Kalitlar" panelini XAVFSIZ qilish
-- ============================================================
--
-- ⚠️  HOZIRGI MUAMMO (kritik):
--
--  1. `useCatalogData.js` VLESS konfiglarini sahifa ochilishi bilanoq,
--     PAROLDAN OLDIN brauzerga yuklaydi. Parol faqat UI da yashiradi.
--  2. `getTashkentPassword()` parolni brauzerda soatdan hisoblaydi —
--     algoritm JS bundle ichida, ya'ni har kim hisoblab chiqara oladi.
--  3. Google Sheet havolasi ham bundle ichida va sheet HAMMAGA ochiq.
--     Ya'ni parolni buzishning ham hojati yo'q — URL ni ochish kifoya.
--
--  Natija: ~47 ta VLESS UUID amalda ochiq internetda turibdi.
--
-- ✅ SHU FAYL NIMA QILADI:
--     kalitlar Postgres'ga o'tadi, RLS ularni to'liq yopadi, va faqat
--     server tomonda parolni tekshiradigan funksiya orqali beriladi.
--
-- ⚠️  BUNI ISHGA TUSHIRGANDAN KEYIN SHART:
--     a) Google Sheet'dagi kalitlar varag'ini O'CHIRING
--     b) Sheet'ni "Restricted" qiling (link orqali ochiq qoldirmang)
--     c) VLESS UUID larini SERVERDA YANGILANG — eskilari kompromis bo'lgan
-- ============================================================

-- ⚠️ Supabase kengaytmalarni `public` emas, `extensions` sxemasida saqlaydi.
-- Shuning uchun quyidagi funksiyalarda search_path ga `extensions` ham
-- qo'shilgan — aks holda crypt()/gen_salt() "does not exist" xatosi chiqadi.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Skriptning qolgan qismi uchun: gin_trgm_ops, unaccent, crypt kabi
-- kengaytma obyektlari topilishi uchun `extensions` sxemasi ham qidirilsin.
set search_path = public, extensions;

-- ------------------------------------------------------------
-- Kalitlar (VLESS konfiglar, litsenziya kalitlari va h.k.)
-- ------------------------------------------------------------
create table if not exists access_keys (
  id         bigserial primary key,
  label      text,                        -- 'Germaniya-1'
  domain     text,
  kind       text default 'vless',        -- 'vless' | 'license' | 'api'
  secret     text not null,               -- ⚠️ maxfiy qiymat
  is_active  boolean not null default true,
  sort_order int not null default 0,
  note       text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Parol (ochiq holda EMAS — bcrypt hash)
-- ------------------------------------------------------------
create table if not exists app_secrets (
  name       text primary key,
  hash       text not null,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Urinishlar jurnali (brute-force'ga qarshi)
-- ------------------------------------------------------------
create table if not exists access_attempts (
  id        bigserial primary key,
  client_id text,
  ok        boolean not null,
  ts        timestamptz not null default now()
);
create index if not exists access_attempts_idx on access_attempts (client_id, ts desc);

-- ------------------------------------------------------------
-- RLS: uch jadval ham TO'LIQ yopiq.
-- Policy umuman yaratilmaydi => anon/authenticated hech narsa o'qiy olmaydi.
-- Yagona eshik — quyidagi security definer funksiya.
-- ------------------------------------------------------------
alter table access_keys     enable row level security;
alter table app_secrets     enable row level security;
alter table access_attempts enable row level security;

alter table access_keys     force row level security;
alter table app_secrets     force row level security;

-- ------------------------------------------------------------
-- Parolni o'rnatish (faqat SQL Editor / service_role ishlatadi)
-- ------------------------------------------------------------
create or replace function set_keys_password(p_new text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  insert into app_secrets (name, hash, updated_at)
  values ('keys_password', crypt(p_new, gen_salt('bf', 12)), now())
  on conflict (name) do update
    set hash = excluded.hash, updated_at = now();
$$;

revoke all on function set_keys_password(text) from public;

-- ------------------------------------------------------------
-- ⭐ Yagona eshik: parol SERVERDA tekshiriladi
-- ------------------------------------------------------------
-- ⚠️ DIQQAT: bu funksiya xatoni `raise exception` bilan QAYTARMAYDI.
--    Sabab: Postgres'da exception butun statement'ni rollback qiladi —
--    ya'ni `access_attempts` ga yozilgan xato urinish ham o'chib ketardi
--    va throttle HECH QACHON ishlamasdi. Shuning uchun natija jsonb sifatida
--    qaytariladi: {ok:false, reason:...} yoki {ok:true, keys:[...]}.
create or replace function unlock_keys(p_password text, p_client text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash  text;
  v_fails int;
  v_keys  jsonb;
begin
  -- Throttle: 15 daqiqada 10 ta xato urinishdan keyin blok
  select count(*) into v_fails
    from access_attempts a
   where a.client_id = p_client
     and not a.ok
     and a.ts > now() - interval '15 minutes';

  if v_fails >= 10 then
    return jsonb_build_object(
      'ok', false, 'reason', 'too_many_attempts', 'retry_after_minutes', 15);
  end if;

  select s.hash into v_hash from app_secrets s where s.name = 'keys_password';

  if v_hash is null or crypt(p_password, v_hash) <> v_hash then
    insert into access_attempts (client_id, ok) values (p_client, false);
    perform pg_sleep(0.4);          -- vaqt bo'yicha hujumni sekinlashtirish
    return jsonb_build_object(
      'ok', false, 'reason', 'invalid_password',
      'attempts_left', greatest(0, 9 - v_fails));
  end if;

  insert into access_attempts (client_id, ok) values (p_client, true);

  select coalesce(
           jsonb_agg(jsonb_build_object(
             'id', k.id, 'label', k.label, 'domain', k.domain,
             'kind', k.kind, 'secret', k.secret
           ) order by k.sort_order, k.id),
           '[]'::jsonb)
    into v_keys
    from access_keys k
   where k.is_active;

  return jsonb_build_object('ok', true, 'keys', v_keys);
end;
$$;

-- Faqat ushbu funksiyaga ruxsat (jadvalga emas)
revoke all on function unlock_keys(text, text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function unlock_keys(text, text) to anon, authenticated';
  end if;
end $$;

-- Eski urinishlarni tozalash (Supabase cron yoki qo'lda)
create or replace function prune_access_attempts()
returns void language sql as $$
  delete from access_attempts where ts < now() - interval '7 days';
$$;

-- ============================================================
-- O'RNATISH (SQL Editor'da bir marta bajaring)
-- ============================================================
--
--   select set_keys_password('BU_YERGA_KUCHLI_PAROL');
--
-- Parol kamida 16 belgi, tasodifiy bo'lsin. Masalan:
--   select set_keys_password(encode(gen_random_bytes(12), 'base64'));
-- keyin uni bir marta ko'rib oling:
--   select hash from app_secrets;   -- ❌ bu hash, parol emas
-- shuning uchun parolni O'ZINGIZ tanlang va parol menejerida saqlang.
--
-- Tekshirish:
--   select unlock_keys('BU_YERGA_KUCHLI_PAROL', 'test');   -- ✅ {"ok":true,"keys":[...]}
--   select unlock_keys('xato', 'test');                    -- ❌ {"ok":false,...}
-- ============================================================

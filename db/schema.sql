-- ============================================================
-- KattaBaza — Postgres sxemasi (Supabase)
-- v1 — 2026-08-15
-- Ishga tushirish: Supabase Dashboard → SQL Editor → butun faylni paste → Run
-- ============================================================

-- ⚠️ Supabase kengaytmalarni `extensions` sxemasida saqlaydi (public emas).
-- Quyidagi funksiyalarda search_path ga `extensions` qo'shilgan — busiz
-- unaccent() "does not exist" xatosini beradi.
create schema if not exists extensions;
create extension if not exists pg_trgm  with schema extensions;  -- fuzzy qidiruv
create extension if not exists unaccent with schema extensions;  -- diakritikasiz qidiruv

-- Skriptning qolgan qismi uchun: gin_trgm_ops, unaccent, crypt kabi
-- kengaytma obyektlari topilishi uchun `extensions` sxemasi ham qidirilsin.
set search_path = public, extensions;

-- ------------------------------------------------------------
-- 1. KANALLAR
-- ------------------------------------------------------------
create table if not exists channels (
  id            bigserial primary key,
  tg_chat_id    bigint unique not null,       -- masalan -1002875124213
  username      text,                         -- 'appskattabaza' (@ siz)
  title         text,
  role          text not null default 'target'
                check (role in ('source','target','both')),
  topic         text,                         -- 'apps' | 'medicina' | 'books' ...
  bot_token_ref text,                         -- .env dagi KALIT NOMI, tokenning o'zi EMAS
  is_active     boolean not null default true,
  last_synced_msg_id bigint default 0,        -- ko'chirish qayerda to'xtaganini eslab qoladi
  created_at    timestamptz not null default now()
);

comment on column channels.bot_token_ref is
  'Faqat .env kalitining nomi, masalan BOT_TOKEN_APPS. Haqiqiy token hech qachon bazada saqlanmaydi.';

-- ------------------------------------------------------------
-- 2. KATEGORIYALAR
-- ------------------------------------------------------------
create table if not exists categories (
  id        bigserial primary key,
  slug      text unique not null,             -- 'vpn', 'windows', 'anatomiya'
  name_uz   text not null,
  name_ru   text,
  name_en   text,
  parent_id bigint references categories(id) on delete set null,
  sort_order int not null default 0
);

-- ------------------------------------------------------------
-- 3. MATERIALLAR  (asosiy jadval)
-- ------------------------------------------------------------
create table if not exists materials (
  id            bigserial primary key,

  -- Kontent
  title         text not null,
  description   text,
  author        text,
  version       text,
  lang          text,                         -- 'uz' | 'ru' | 'en'
  kind          text,                         -- 'app' | 'book' | 'video' | 'post' | 'archive'
  platform      text,                         -- 'windows' | 'android' | 'ios' | 'archive' | 'web'
  file_type     text,                         -- 'zip' | 'exe' | 'pdf' | 'mp4' ...
  size_bytes    bigint,                       -- ⚠️ MB emas, BAYT. Sheet'dagi "135,23" konvert qilinadi.

  -- Telegram
  tg_file_id        text,                     -- yuborish uchun (vaqt o'tishi bilan eskirishi mumkin)
  tg_file_unique_id text,                     -- ⭐ global unikal — DUBLIKAT NAZORATI
  source_chat_id    bigint,
  source_msg_id     bigint,
  target_chat_id    bigint,
  target_msg_id     bigint,
  post_link         text,                     -- https://t.me/appskattabaza/203

  -- Saqlash
  sha256        text,                         -- fayl yuklab olingan bo'lsa
  r2_key        text,                         -- R2 dagi kalit (kesh yoki doimiy)
  r2_cached_at  timestamptz,                  -- lifecycle uchun
  external_url  text,                         -- tashqi havola (Sheet'dagi file_url)
  preview_url   text,
  gallery_urls  text[],                       -- Sheet'da vergul bilan edi → massiv

  -- Holat
  status        text not null default 'published'
                check (status in ('pending','copying','copied','published','failed','blocked')),
  fail_reason   text,
  download_count bigint not null default 0,

  -- Xavfsizlik tekshiruvi (VirusTotal) — bloklamaydi, faqat ko'rsatadi
  vt_malicious  int,                          -- nechta antivirus shubha bildirdi
  vt_total      int,                          -- jami nechta antivirus tekshirdi
  vt_permalink  text,                         -- VirusTotal hisobotiga havola
  vt_scanned_at timestamptz,

  -- Qidiruv
  tags          text[],
  search_vector tsvector,

  -- Analiz agenti (bot/analyze.py) natijalari
  lang_detected text,                         -- 'uz' | 'ru' | 'en' | 'unknown'
  year          int,                          -- nashr yili (nom/izohdan)
  form          text,                         -- 'darslik' | 'atlas' | 'maruza' | ...
  confidence    numeric(3,2),                 -- 0.00 – 1.00
  needs_review  boolean not null default false, -- ishonch past -> qo'lda ko'rish

  -- ⭐ MANBA kanalda qachon joylangani. Saytda va kanalda tartib SHU
  --    ustun bo'yicha bo'ladi — nusxa olingan sana bo'yicha emas.
  source_posted_at timestamptz,

  created_at    timestamptz not null default now(),
  published_at  timestamptz,
  updated_at    timestamptz not null default now()
);

-- ⭐ Dublikat nazorati: bir xil fayl ikki marta tushmaydi.
-- Partial unique — NULL qiymatlar bir-biriga xalaqit bermaydi.
create unique index if not exists materials_tg_unique_idx
  on materials (tg_file_unique_id) where tg_file_unique_id is not null;

create unique index if not exists materials_sha256_idx
  on materials (sha256) where sha256 is not null;

create unique index if not exists materials_post_link_idx
  on materials (post_link) where post_link is not null;

-- Qidiruv indekslari
create index if not exists materials_search_idx on materials using gin (search_vector);
create index if not exists materials_title_trgm_idx on materials using gin (title gin_trgm_ops);
create index if not exists materials_tags_idx on materials using gin (tags);

-- Ro'yxat/filtr indekslari
create index if not exists materials_status_created_idx on materials (status, created_at desc);
-- Saytdagi asosiy tartib: manbada joylangan sana bo'yicha
create index if not exists materials_posted_idx
  on materials (source_posted_at desc nulls last) where status = 'published';
-- Qo'lda ko'rib chiqish navbati
create index if not exists materials_review_idx on materials (needs_review, confidence)
  where needs_review;
create index if not exists materials_kind_idx on materials (kind) where status = 'published';
create index if not exists materials_platform_idx on materials (platform) where status = 'published';

-- ------------------------------------------------------------
-- 4. MATERIAL ↔ KATEGORIYA
-- ------------------------------------------------------------
create table if not exists material_categories (
  material_id bigint not null references materials(id) on delete cascade,
  category_id bigint not null references categories(id) on delete cascade,
  primary key (material_id, category_id)
);
create index if not exists matcat_category_idx on material_categories (category_id);

-- ------------------------------------------------------------
-- 5. NAVBAT (jobs)
-- ------------------------------------------------------------
create table if not exists jobs (
  id          bigserial primary key,
  type        text not null,                  -- 'scan_channel' | 'copy_message' | 'make_preview' | 'cache_to_r2'
  payload     jsonb not null default '{}'::jsonb,
  status      text not null default 'queued'
              check (status in ('queued','running','done','failed','dead')),
  priority    int not null default 100,       -- kichik = muhimroq
  attempts    int not null default 0,
  max_attempts int not null default 5,
  last_error  text,
  run_after   timestamptz not null default now(),
  locked_by   text,
  locked_at   timestamptz,
  created_at  timestamptz not null default now()
);

-- Worker shu indeks bilan navbatdan oladi
create index if not exists jobs_pick_idx on jobs (status, priority, run_after)
  where status in ('queued','failed');

-- ------------------------------------------------------------
-- 6. STATISTIKA
-- ------------------------------------------------------------
create table if not exists downloads (
  id          bigserial primary key,
  material_id bigint references materials(id) on delete cascade,
  ts          timestamptz not null default now(),
  ip_hash     text,                           -- ⚠️ xom IP EMAS, sho'rlangan hash
  country     text,
  ua          text
);
create index if not exists downloads_material_ts_idx on downloads (material_id, ts desc);

-- ============================================================
-- TRIGGERLAR
-- ============================================================

-- search_vector avtomatik to'ldiriladi (uz/ru/en aralash → 'simple' konfiguratsiya)
create or replace function materials_search_trigger() returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.search_vector :=
      setweight(to_tsvector('simple', unaccent(coalesce(new.title,''))), 'A')
   || setweight(to_tsvector('simple', unaccent(coalesce(new.description,''))), 'B')
   || setweight(to_tsvector('simple', unaccent(coalesce(array_to_string(new.tags,' '),''))), 'C')
   || setweight(to_tsvector('simple', unaccent(coalesce(new.author,''))), 'D');
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists materials_search_update on materials;
create trigger materials_search_update
  before insert or update on materials
  for each row execute function materials_search_trigger();

-- ============================================================
-- KO'RINISHLAR (frontend uchun qulay)
-- ============================================================
create or replace view v_materials_public as
select
  m.id, m.title, m.description, m.author, m.version, m.lang,
  m.kind, m.platform, m.file_type,
  round(m.size_bytes / 1048576.0, 2) as size_mb,
  m.preview_url, m.gallery_urls, m.post_link, m.external_url,
  m.tags, m.download_count, m.created_at,
  m.lang_detected, m.year, m.form, m.confidence, m.needs_review,
  coalesce(m.source_posted_at, m.published_at, m.created_at) as posted_at,
  m.vt_malicious, m.vt_total, m.vt_permalink,
  -- Saytda ko'rsatish uchun tayyor belgi
  case
    when m.vt_malicious is null then 'unknown'
    when m.vt_malicious = 0     then 'clean'
    when m.vt_malicious <= 3    then 'suspicious'
    else 'dangerous'
  end as safety,
  coalesce(
    array_agg(c.slug order by c.slug) filter (where c.slug is not null),
    '{}'
  ) as categories
from materials m
left join material_categories mc on mc.material_id = m.id
left join categories c on c.id = mc.category_id
where m.status = 'published'
group by m.id;

-- Kanallar — saytda ko'rsatish uchun XAVFSIZ ustunlar.
-- `channels` jadvalining o'zi RLS bilan yopiq; bu view faqat zararsiz
-- ustunlarni ochadi (bot_token_ref va last_synced_msg_id chiqmaydi).
create or replace view v_channels_public as
select tg_chat_id, username, title, topic
from channels
where is_active;

-- ============================================================
-- RLS — Supabase'da MAJBURIY
-- (anon kalit brauzerda ko'rinadi, shuning uchun faqat o'qish ochiladi)
-- ============================================================
alter table materials  enable row level security;
alter table channels   enable row level security;
alter table categories enable row level security;
alter table material_categories enable row level security;
alter table jobs       enable row level security;
alter table downloads  enable row level security;

-- Hamma faqat chop etilgan materiallarni o'qiy oladi
drop policy if exists "public read published" on materials;
create policy "public read published" on materials
  for select using (status = 'published');

drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);

drop policy if exists "public read matcat" on material_categories;
create policy "public read matcat" on material_categories for select using (true);

-- channels, jobs, downloads → hech qanday public policy YO'Q.
-- Ularga faqat service_role kaliti (bot/worker, serverda) kira oladi.

-- ============================================================
-- QIDIRUV FUNKSIYASI (frontend RPC orqali chaqiradi)
-- ============================================================
create or replace function search_materials(
  q text default '',
  p_kind text default null,
  p_platform text default null,
  p_category text default null,
  p_limit int default 24,
  p_offset int default 0
)
returns setof v_materials_public
language sql stable
set search_path = public, extensions
as $$
  select * from v_materials_public v
  where (p_kind     is null or v.kind = p_kind)
    and (p_platform is null or v.platform = p_platform)
    and (p_category is null or p_category = any(v.categories))
    and (
      q = '' or
      v.title ilike '%' || q || '%' or
      v.description ilike '%' || q || '%' or
      exists (select 1 from materials m
              where m.id = v.id
                and m.search_vector @@ plainto_tsquery('simple', unaccent(q)))
    )
  order by v.posted_at desc, v.id desc
  limit least(p_limit, 100) offset p_offset;
$$;

-- Yuklab olishni sanash (atomik)
create or replace function bump_download(p_material_id bigint)
returns void language sql volatile as $$
  update materials set download_count = download_count + 1 where id = p_material_id;
$$;

-- ============================================================
-- BOSHLANG'ICH MA'LUMOT — KattaBaza kanallari
-- ⚠️ tg_chat_id ni to'g'rilang: botni kanalga admin qiling va
--    /chatid buyrug'ini yuboring (admin_bot.py shu buyruqni beradi).
-- ============================================================
-- Faqat BIZGA tegishli kanal. Manba kanallar (@med_baza1, @modzzz21 va h.k.)
-- bu yerga qo'lda yozilmaydi — `bot/mirror.py` ularni birinchi ko'chirishda
-- role='source' bilan avtomatik ro'yxatga oladi.
insert into channels (tg_chat_id, username, title, role, topic, bot_token_ref) values
  (-1002875124213, 'appskattabaza', 'apps KattaBaza', 'target', 'apps', 'BOT_TOKEN_APPS')
on conflict (tg_chat_id) do update
  set username = excluded.username,
      title    = excluded.title,
      topic    = excluded.topic,
      bot_token_ref = excluded.bot_token_ref;

insert into categories (slug, name_uz, name_ru) values
  ('medicina',  'Meditsina',      'Медицина'),
  ('anatomiya', 'Anatomiya',      'Анатомия'),
  ('farmakologiya','Farmakologiya','Фармакология'),
  ('kitob',     'Kitoblar',       'Книги'),
  ('video',     'Videodarslar',   'Видеоуроки'),
  ('windows',   'Windows',        'Windows'),
  ('android',   'Android',        'Android'),
  ('vpn',       'VPN',            'VPN')
on conflict (slug) do nothing;

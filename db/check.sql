-- ============================================================
-- TEKSHIRUV — hammasi joyidami?
-- Supabase SQL Editor'ga to'liq paste qiling va Run bosing.
-- Har qatorda ✅ bo'lishi kerak.
-- ============================================================

select
  'Jadvallar'                                              as tekshiruv,
  count(*)::text || ' / 9'                                 as natija,
  case when count(*) >= 9 then '✅' else '❌ schema.sql qayta ishga tushiring' end as holat
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'

union all
select 'Funksiyalar',
       count(*)::text || ' / 5',
       case when count(*) >= 5 then '✅' else '❌ fayllarni qayta ishga tushiring' end
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('search_materials','bump_download','unlock_keys',
                    'set_keys_password','materials_search_trigger')

union all
select 'Kalitlar paroli',
       coalesce((select 'o''rnatilgan' from app_secrets where name='keys_password'), 'YO''Q'),
       case when exists (select 1 from app_secrets where name='keys_password')
            then '✅' else '❌ set_keys_password(...) ni bajaring' end

union all
select 'RLS himoyasi',
       count(*)::text || ' / 9 jadvalda yoqilgan',
       case when count(*) >= 9 then '✅' else '❌' end
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity

union all
select 'Maxfiy jadvallar yopiq',
       count(*)::text || ' ta ochiq policy (0 bo''lishi kerak)',
       case when count(*) = 0 then '✅' else '❌ XAVF: kalitlar ochiq!' end
from pg_policies
where schemaname = 'public' and tablename in ('access_keys','app_secrets','channels','jobs')

union all
select 'Kategoriyalar',
       count(*)::text || ' ta',
       case when count(*) >= 8 then '✅' else '⚠️ kam' end
from categories

union all
select 'Kanallar',
       count(*)::text || ' ta',
       case when count(*) >= 1 then '✅' else '⚠️ bo''sh' end
from channels

union all
select 'Qidiruv ishlayapti',
       'search_materials()',
       case when (select count(*) from search_materials('')) >= 0
            then '✅' else '❌' end;

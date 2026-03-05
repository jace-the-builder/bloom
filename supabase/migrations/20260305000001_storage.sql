-- ──────────────────────────────────────────────
-- Storage bucket: flowers (public)
-- ──────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('flowers', 'flowers', true)
on conflict (id) do nothing;

-- Anyone can read flower images
create policy "Public can read flower images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'flowers');

-- Anyone can upload flower images
create policy "Anyone can upload flower images"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'flowers');

-- ──────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────
alter table events  enable row level security;
alter table flowers enable row level security;

-- Events: public read
create policy "Public can read events"
  on events for select
  to anon, authenticated
  using (true);

-- Flowers: public read
create policy "Public can read flowers"
  on flowers for select
  to anon, authenticated
  using (true);

-- Flowers: anyone can insert
create policy "Anyone can insert a flower"
  on flowers for insert
  to anon, authenticated
  with check (true);

-- ──────────────────────────────────────────────
-- Realtime
-- ──────────────────────────────────────────────
alter publication supabase_realtime add table flowers;

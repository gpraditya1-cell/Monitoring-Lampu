-- ============================================================
-- Monitoring History Lampu — Supabase Migration
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. USER PROFILES (extends Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz default now()
);

-- Auto-create profile saat user baru register
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. MAPS (denah gedung)
create table if not exists public.maps (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  area_codes text[] not null default '{}',
  image_url text,
  is_active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. LAMPS (master titik lampu)
create table if not exists public.lamps (
  id uuid default gen_random_uuid() primary key,
  lamp_code text not null unique,
  area_code text not null,
  area_name text not null,
  lamp_position text not null default 'LMD' check (lamp_position in ('LMD', 'LML')),
  group_code text not null,
  lamp_number text not null,
  map_id uuid references public.maps(id) on delete set null,
  pos_x numeric(6,2) not null default 50,
  pos_y numeric(6,2) not null default 50,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. LAMP HISTORY (pergantian)
create table if not exists public.lamp_history (
  id uuid default gen_random_uuid() primary key,
  lamp_id uuid references public.lamps(id) on delete cascade not null,
  tanggal date not null,
  kondisi text not null check (kondisi in ('Mati', 'Redup / Kedip', 'Pecah / Rusak')),
  tindakan text not null default 'Ganti Lampu',
  catatan text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.maps enable row level security;
alter table public.lamps enable row level security;
alter table public.lamp_history enable row level security;

-- profiles: user bisa baca semua, edit sendiri
create policy "profiles_select" on public.profiles for select using (auth.uid() is not null);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- maps: semua authenticated bisa baca, hanya admin yang bisa write
create policy "maps_select" on public.maps for select using (auth.uid() is not null);
create policy "maps_insert_admin" on public.maps for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "maps_update_admin" on public.maps for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "maps_delete_admin" on public.maps for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- lamps: semua bisa baca, admin bisa write
create policy "lamps_select" on public.lamps for select using (auth.uid() is not null);
create policy "lamps_insert_admin" on public.lamps for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "lamps_update_admin" on public.lamps for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "lamps_delete_admin" on public.lamps for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- lamp_history: semua bisa baca & insert, hanya admin yang bisa delete
create policy "history_select" on public.lamp_history for select using (auth.uid() is not null);
create policy "history_insert" on public.lamp_history for insert with check (auth.uid() is not null);
create policy "history_delete_admin" on public.lamp_history for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- STORAGE BUCKET (untuk gambar denah)
-- ============================================================
insert into storage.buckets (id, name, public) values ('maps', 'maps', true)
on conflict (id) do nothing;

create policy "maps_storage_select" on storage.objects for select using (bucket_id = 'maps');
create policy "maps_storage_insert" on storage.objects for insert with check (
  bucket_id = 'maps' and
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "maps_storage_delete" on storage.objects for delete using (
  bucket_id = 'maps' and
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- SEED DATA — Map Gudang 1 & 2
-- ============================================================
insert into public.maps (id, name, description, area_codes)
values (
  '00000000-0000-0000-0000-000000000001',
  'Lampu TL Gudang 1 & 2',
  'Gudang 1 (AC) baris A-F, Gudang 2 (AD) baris G-M',
  array['AC', 'AD']
) on conflict (id) do nothing;

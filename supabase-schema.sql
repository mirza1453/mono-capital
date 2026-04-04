-- ═══════════════════════════════════════════════════════
-- MONO CAPITAL — Supabase Veritabanı Şeması v1.0
-- Supabase Dashboard > SQL Editor > New Query > Yapıştır > Run
-- ═══════════════════════════════════════════════════════

-- 1. Profiller
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  ad text not null,
  eposta text not null,
  rol text not null check (rol in ('office', 'client')),
  renk text,
  ana_firma text,
  bildirim_acik boolean default true,
  created_at timestamptz default now()
);

-- 2. Firmalar
create table if not exists firmalar (
  id uuid default gen_random_uuid() primary key,
  ad text not null,
  vkn text,
  office_user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- 3. Firma-Kullanıcı ilişkisi
create table if not exists firma_kullanici (
  id uuid default gen_random_uuid() primary key,
  firma_id uuid references firmalar(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  unique(firma_id, user_id)
);

-- 4. Şablonlar
create table if not exists sablonlar (
  id uuid default gen_random_uuid() primary key,
  ad text not null,
  office_user_id uuid references profiles(id) on delete cascade,
  alanlar jsonb default '[]',
  kontrol_sablonu jsonb default '[]',
  aciklama_sablonu text default '',
  bildirim_sablonu text default '{firmaAd} firmasının {sablonAd} işlemi tamamlanmıştır.',
  baslik_format jsonb default '["firmaAd","sablonAd"]',
  baslik_sep text default ' • ',
  created_at timestamptz default now()
);

-- 5. Talepler
create table if not exists talepler (
  id uuid default gen_random_uuid() primary key,
  firma_id uuid references firmalar(id) on delete cascade,
  olusturan_id uuid references profiles(id),
  olusturan text not null check (olusturan in ('office', 'client')),
  atanan_id uuid references profiles(id),
  kisi text,
  sablon_id uuid references sablonlar(id),
  sablon_ad text not null,
  alanlar jsonb default '[]',
  durum text not null default 'beklemede' check (durum in ('beklemede', 'isleniyor', 'tamamlandi')),
  acil boolean default false,
  aciklama text,
  mukellef_gorsun boolean default true,
  bildirim_gonder boolean default true,
  musavir_not text,
  musavir_checkler jsonb default '[]',
  sonuclar jsonb default '[]',
  arsiv boolean default false,
  sira integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Bildirimler
create table if not exists bildirimler (
  id uuid default gen_random_uuid() primary key,
  tip text not null,
  mesaj text not null,
  hedef text not null check (hedef in ('office', 'client')),
  firma_id uuid references firmalar(id) on delete cascade,
  talep_id uuid references talepler(id) on delete set null,
  okundu boolean default false,
  created_at timestamptz default now()
);

-- 7. Dosyalar
create table if not exists dosyalar (
  id uuid default gen_random_uuid() primary key,
  firma_id uuid references firmalar(id) on delete cascade,
  ad text not null,
  klasor text default 'Genel',
  boyut text,
  storage_path text,
  ekleyen_id uuid references profiles(id),
  ekleyen text,
  is_klasor boolean default false,
  is_pin boolean default false,
  pin_key text,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════

alter table profiles enable row level security;
alter table firmalar enable row level security;
alter table firma_kullanici enable row level security;
alter table sablonlar enable row level security;
alter table talepler enable row level security;
alter table bildirimler enable row level security;
alter table dosyalar enable row level security;

-- Profiles
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (true);

-- Firmalar
create policy "firmalar_all" on firmalar for all using (
  office_user_id = auth.uid() or 
  id in (select firma_id from firma_kullanici where user_id = auth.uid())
);
create policy "firmalar_insert" on firmalar for insert with check (true);

-- Firma Kullanıcı
create policy "fk_all" on firma_kullanici for all using (
  user_id = auth.uid() or
  firma_id in (select id from firmalar where office_user_id = auth.uid())
);
create policy "fk_insert" on firma_kullanici for insert with check (true);

-- Şablonlar
create policy "sablonlar_select" on sablonlar for select using (true);
create policy "sablonlar_modify" on sablonlar for all using (office_user_id = auth.uid());
create policy "sablonlar_insert" on sablonlar for insert with check (true);

-- Talepler
create policy "talepler_all" on talepler for all using (
  firma_id in (
    select id from firmalar where office_user_id = auth.uid()
    union
    select firma_id from firma_kullanici where user_id = auth.uid()
  )
);
create policy "talepler_insert" on talepler for insert with check (true);

-- Bildirimler
create policy "bildirimler_all" on bildirimler for all using (true);
create policy "bildirimler_insert" on bildirimler for insert with check (true);

-- Dosyalar
create policy "dosyalar_all" on dosyalar for all using (
  firma_id in (
    select id from firmalar where office_user_id = auth.uid()
    union
    select firma_id from firma_kullanici where user_id = auth.uid()
  )
);
create policy "dosyalar_insert" on dosyalar for insert with check (true);

-- ═══════════════════════════════════════════════════════
-- Realtime
-- ═══════════════════════════════════════════════════════

alter publication supabase_realtime add table talepler;
alter publication supabase_realtime add table bildirimler;
alter publication supabase_realtime add table dosyalar;

-- ═══════════════════════════════════════════════════════
-- Trigger: yeni kullanıcı → profil oluştur
-- ═══════════════════════════════════════════════════════

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, ad, eposta, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'ad', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'rol', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Trigger: updated_at otomatik
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists talepler_updated on talepler;
create trigger talepler_updated
  before update on talepler
  for each row execute function update_updated_at();

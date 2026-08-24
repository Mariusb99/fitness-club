-- Fitness Club — schema platformă internă antrenori + administrator
-- Rulează acest fișier în Supabase SQL editor.
--
-- Fișierul e scris să poată fi rulat de mai multe ori fără erori: dacă un
-- tip, tabel sau politică există deja, pasul respectiv e sărit. Așa poți
-- reveni oricând peste el după ce adaugi ceva nou, fără să pierzi date.

create extension if not exists "pgcrypto";

-- =========================================================
-- ENUMS
-- =========================================================
do $$ begin
  create type public.user_role as enum ('admin', 'trainer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.client_status as enum ('activ', 'suspendat', 'inactiv');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.photo_type as enum ('before', 'after', 'progress');
exception when duplicate_object then null; end $$;

-- Unghiul din care e făcută fotografia. Împreună cu photo_type (momentul:
-- înainte / progres / după) descrie complet o poză: de exemplu „față,
-- înainte" se compară cu „față, după".
do $$ begin
  create type public.photo_angle as enum ('fata', 'spate', 'lateral_stanga', 'lateral_dreapta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_kind as enum ('certificare', 'diploma');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.audit_action as enum ('creare', 'modificare', 'stergere');
exception when duplicate_object then null; end $$;

-- =========================================================
-- PROFILES — un rând per utilizator din auth.users
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'trainer',
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  birth_date date,
  years_experience integer,
  specializations text[] not null default '{}',
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Coloane adăugate ulterior (pentru baze create cu o versiune mai veche)
alter table public.profiles add column if not exists is_active boolean not null default true;

-- =========================================================
-- DOCUMENTE ANTRENOR — certificări / diplome
-- =========================================================
create table if not exists public.trainer_documents (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  kind public.document_kind not null,
  name text not null,
  file_path text not null, -- cale în Supabase Storage (bucket trainer-documents)
  uploaded_at timestamptz not null default now()
);

-- =========================================================
-- CLIENȚI
-- =========================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete restrict,
  full_name text not null,
  email text,
  phone text,
  birth_date date,
  gender text check (gender in ('M', 'F')),
  status public.client_status not null default 'activ',
  goals text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

-- Anamneză — date medicale sensibile, tabel separat pentru claritate
-- și pentru a putea aplica ulterior politici de acces suplimentare.
create table if not exists public.client_anamnesis (
  client_id uuid primary key references public.clients (id) on delete cascade,
  medical_conditions text,
  medications text,
  injuries text,
  allergies text,
  contraindications text,
  notes text,
  updated_at timestamptz not null default now()
);

-- Măsurători — fișa inițială (is_initial = true) + actualizări lunare
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  recorded_at date not null default current_date,
  is_initial boolean not null default false,
  weight_kg numeric(5, 2) not null,
  height_cm numeric(5, 2) not null,
  arms_cm numeric(5, 2),
  chest_cm numeric(5, 2),
  waist_cm numeric(5, 2),
  hips_cm numeric(5, 2),
  thigh_cm numeric(5, 2),
  calf_cm numeric(5, 2),
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- Fotografii înainte/după și de progres, legate opțional de o măsurătoare
create table if not exists public.client_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  measurement_id uuid references public.measurements (id) on delete set null,
  photo_type public.photo_type not null default 'progress',
  angle public.photo_angle not null default 'fata',
  file_path text not null, -- cale în Supabase Storage (bucket client-photos)
  taken_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.client_photos
  add column if not exists angle public.photo_angle not null default 'fata';

-- =========================================================
-- JURNAL DE ACȚIUNI — audit trail
-- =========================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action public.audit_action not null,
  entity_type text not null,
  entity_label text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- INDECȘI — interogările cele mai frecvente
-- =========================================================
create index if not exists clients_trainer_id_idx on public.clients (trainer_id);
create index if not exists measurements_client_id_idx on public.measurements (client_id);
create index if not exists client_photos_client_id_idx on public.client_photos (client_id);
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

-- =========================================================
-- HELPER: rolul utilizatorului curent (evită recursivitate RLS)
-- =========================================================
create or replace function public.current_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.profiles enable row level security;
alter table public.trainer_documents enable row level security;
alter table public.clients enable row level security;
alter table public.client_anamnesis enable row level security;
alter table public.measurements enable row level security;
alter table public.client_photos enable row level security;
alter table public.audit_log enable row level security;

-- PROFILES: adminul vede/editează tot; antrenorul își vede/editează doar profilul propriu
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (public.is_admin() or id = auth.uid());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
  for update using (public.is_admin() or id = auth.uid());

drop policy if exists "profiles_insert_admin_only" on public.profiles;
create policy "profiles_insert_admin_only" on public.profiles
  for insert with check (public.is_admin());

drop policy if exists "profiles_delete_admin_only" on public.profiles;
create policy "profiles_delete_admin_only" on public.profiles
  for delete using (public.is_admin());

-- TRAINER DOCUMENTS
drop policy if exists "trainer_documents_select" on public.trainer_documents;
create policy "trainer_documents_select" on public.trainer_documents
  for select using (public.is_admin() or trainer_id = auth.uid());

drop policy if exists "trainer_documents_write" on public.trainer_documents;
create policy "trainer_documents_write" on public.trainer_documents
  for all using (public.is_admin() or trainer_id = auth.uid())
  with check (public.is_admin() or trainer_id = auth.uid());

-- CLIENTS: adminul vede tot; antrenorul vede/editează doar clienții proprii
drop policy if exists "clients_select" on public.clients;
create policy "clients_select" on public.clients
  for select using (public.is_admin() or trainer_id = auth.uid());

drop policy if exists "clients_insert" on public.clients;
create policy "clients_insert" on public.clients
  for insert with check (public.is_admin() or trainer_id = auth.uid());

drop policy if exists "clients_update" on public.clients;
create policy "clients_update" on public.clients
  for update using (public.is_admin() or trainer_id = auth.uid());

drop policy if exists "clients_delete" on public.clients;
create policy "clients_delete" on public.clients
  for delete using (public.is_admin() or trainer_id = auth.uid());

-- ANAMNESIS / MEASUREMENTS / PHOTOS: acces derivat din proprietarul clientului
drop policy if exists "anamnesis_all" on public.client_anamnesis;
create policy "anamnesis_all" on public.client_anamnesis
  for all using (
    public.is_admin() or exists (
      select 1 from public.clients c
      where c.id = client_anamnesis.client_id and c.trainer_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.clients c
      where c.id = client_anamnesis.client_id and c.trainer_id = auth.uid()
    )
  );

drop policy if exists "measurements_all" on public.measurements;
create policy "measurements_all" on public.measurements
  for all using (
    public.is_admin() or exists (
      select 1 from public.clients c
      where c.id = measurements.client_id and c.trainer_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.clients c
      where c.id = measurements.client_id and c.trainer_id = auth.uid()
    )
  );

drop policy if exists "client_photos_all" on public.client_photos;
create policy "client_photos_all" on public.client_photos
  for all using (
    public.is_admin() or exists (
      select 1 from public.clients c
      where c.id = client_photos.client_id and c.trainer_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.clients c
      where c.id = client_photos.client_id and c.trainer_id = auth.uid()
    )
  );

-- AUDIT LOG: doar adminul citește jurnalul complet; scrierea se face din server (service role)
drop policy if exists "audit_log_select_admin" on public.audit_log;
create policy "audit_log_select_admin" on public.audit_log
  for select using (public.is_admin());

-- =========================================================
-- STORAGE — buckete private
--   client-photos      (poze înainte/după, progres)
--   trainer-documents  (certificări, diplome)
--   avatars            (poze de profil)
--
-- Toate sunt private: accesul la fișiere se face exclusiv prin URL-uri
-- semnate, generate de aplicație doar pentru cine are dreptul.
-- =========================================================
insert into storage.buckets (id, name, public)
values
  ('client-photos', 'client-photos', false),
  ('trainer-documents', 'trainer-documents', false),
  ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- Fotografiile clienților se salvează sub calea `<client_id>/<fisier>`,
-- deci primul segment din nume identifică clientul. Un antrenor are acces
-- doar la folderele clienților proprii; adminul, la toate.
drop policy if exists "client_photos_storage_all" on storage.objects;
create policy "client_photos_storage_all" on storage.objects
  for all
  using (
    bucket_id = 'client-photos'
    and (
      public.is_admin() or exists (
        select 1 from public.clients c
        where c.id::text = (storage.foldername(name))[1]
          and c.trainer_id = auth.uid()
      )
    )
  )
  with check (
    bucket_id = 'client-photos'
    and (
      public.is_admin() or exists (
        select 1 from public.clients c
        where c.id::text = (storage.foldername(name))[1]
          and c.trainer_id = auth.uid()
      )
    )
  );

-- Documentele antrenorului stau sub `<trainer_id>/<fisier>`.
drop policy if exists "trainer_documents_storage_all" on storage.objects;
create policy "trainer_documents_storage_all" on storage.objects
  for all
  using (
    bucket_id = 'trainer-documents'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  )
  with check (
    bucket_id = 'trainer-documents'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );

-- Avatarele: fiecare își gestionează propriul folder, adminul le vede pe toate.
drop policy if exists "avatars_storage_all" on storage.objects;
create policy "avatars_storage_all" on storage.objects
  for all
  using (
    bucket_id = 'avatars'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );

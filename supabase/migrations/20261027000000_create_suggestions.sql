-- Tabel saran / masukan untuk halaman /saran Omah Belajar.
-- Jalankan di Supabase Dashboard > SQL Editor (aman dijalankan berulang kali).

-- Helper admin (dipakai juga oleh modul lain di Omah Nalar).
-- WAJIB security definer: tanpa ini, policy pada public.profiles yang juga
-- memanggil is_admin() menyebabkan rekursi tak terbatas
-- ("stack depth limit exceeded", kode 54001).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Anonim',
  category text not null default 'Saran',
  content text not null check (btrim(content) <> ''),
  is_anonymous boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suggestions_status_created_at_idx
  on public.suggestions (status, created_at desc);

-- Trigger updated_at
create or replace function public.set_suggestions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_suggestions_updated_at on public.suggestions;
create trigger set_suggestions_updated_at
  before update on public.suggestions
  for each row
  execute function public.set_suggestions_updated_at();

-- RLS
alter table public.suggestions enable row level security;

grant select, insert on public.suggestions to anon, authenticated;
grant update, delete on public.suggestions to authenticated;

drop policy if exists "Anyone can submit suggestions" on public.suggestions;
create policy "Anyone can submit suggestions"
  on public.suggestions
  for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "Anyone can read approved suggestions" on public.suggestions;
create policy "Anyone can read approved suggestions"
  on public.suggestions
  for select
  to anon, authenticated
  using (status = 'approved' or public.is_admin());

drop policy if exists "Admins can update suggestions" on public.suggestions;
create policy "Admins can update suggestions"
  on public.suggestions
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete suggestions" on public.suggestions;
create policy "Admins can delete suggestions"
  on public.suggestions
  for delete
  to authenticated
  using (public.is_admin());

comment on table public.suggestions is 'Saran/masukan pengunjung Omah Belajar, ditampilkan setelah disetujui admin';
comment on column public.suggestions.status is 'pending = menunggu review, approved = tampil di /saran, rejected = ditolak';

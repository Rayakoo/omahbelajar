-- FIX: "stack depth limit exceeded" (kode 54001) saat membaca baris suggestions.
--
-- Penyebab: policy pada public.suggestions memanggil public.is_admin(), dan
-- is_admin() melakukan SELECT ke public.profiles yang policy-nya
-- ("Admins view all profiles") juga memanggil public.is_admin() -> rekursi
-- tanpa henti. Solusinya: jalankan is_admin() sebagai security definer agar
-- query internalnya melewati RLS public.profiles.
--
-- Jalankan file ini kalau migration 20261027000000_create_suggestions.sql
-- sudah pernah dieksekusi. Aman dijalankan berulang kali.

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

comment on function public.is_admin() is
  'True jika user login berperan admin. Security definer agar tidak rekursi dengan RLS public.profiles.';

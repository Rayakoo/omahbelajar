-- Tambah kolom pendidikan & pekerjaan pada tabel profiles
-- Jalankan di Supabase Dashboard > SQL Editor (aman dijalankan berulang kali).

alter table public.profiles
  add column if not exists pendidikan text,
  add column if not exists pekerjaan text;

-- Pendidikan: pilihan tetap (SD, SMP, SMA, Sarjana dan Sederajat)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_pendidikan_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_pendidikan_check
      check (
        pendidikan is null
        or pendidikan in ('SD', 'SMP', 'SMA', 'Sarjana dan Sederajat')
      );
  end if;
end $$;

-- Pekerjaan: 'Mahasiswa' | 'Ibu Rumah Tangga' | 'Guru dan Dosen' | teks bebas (opsi "Lainnya")
-- Karena opsi "Lainnya" boleh diketik sendiri, kolom ini tidak dibatasi ke daftar nilai.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_pekerjaan_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_pekerjaan_check
      check (pekerjaan is null or btrim(pekerjaan) <> '');
  end if;
end $$;

comment on column public.profiles.pendidikan is 'Pendidikan terakhir: SD, SMP, SMA, Sarjana dan Sederajat';
comment on column public.profiles.pekerjaan is 'Pekerjaan: Mahasiswa, Ibu Rumah Tangga, Guru dan Dosen, atau teks bebas untuk opsi Lainnya';

alter table public.profiles
  drop constraint profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[가-힣a-z0-9._-]{2,40}$');

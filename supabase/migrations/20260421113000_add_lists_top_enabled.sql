alter table public."lists"
add column if not exists "topEnabled" boolean default true not null;

alter table "public"."lists"
add column if not exists "staffListEnabled" boolean not null default true;

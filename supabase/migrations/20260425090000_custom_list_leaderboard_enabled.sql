alter table "public"."lists"
add column if not exists "leaderboardEnabled" boolean not null default true;

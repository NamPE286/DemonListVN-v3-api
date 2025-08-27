alter table "public"."clans" add column "mode" text not null default 'markdown'::text;

alter table "public"."eventProofs" add column "diff" bigint;

alter table "public"."events" add column "isCalculated" boolean not null default false;

alter table "public"."events" add column "isRanked" boolean not null default false;

alter table "public"."players" add column "elo" bigint not null default '1500'::bigint;

alter table "public"."clans" add constraint "clans_mode_check" CHECK ((mode = ANY (ARRAY['markdown'::text, 'iframe'::text]))) not valid;

alter table "public"."clans" validate constraint "clans_mode_check";



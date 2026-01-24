alter table "public"."battlePassLevels" add column "type" text not null default 'normal'::text;

alter table "public"."battlePassLevels" add constraint "battlePassLevels_type_check" CHECK ((type = ANY (ARRAY['normal'::text, 'daily'::text, 'weekly'::text]))) not valid;

alter table "public"."battlePassLevels" validate constraint "battlePassLevels_type_check";



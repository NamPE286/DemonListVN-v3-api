alter table "public"."cards" drop column "activated";

alter table "public"."cards" add column "activationDate" timestamp with time zone;

alter table "public"."cards" add column "img" text not null default 'https://qdwpenfblwdmhywwszzj.supabase.co/storage/v1/object/public/cards/basic.webp'::text;

alter table "public"."cards" add column "name" text not null default 'Basic'::text;

alter table "public"."cards" add column "owner" uuid;

alter table "public"."cards" add constraint "cards_owner_fkey" FOREIGN KEY (owner) REFERENCES players(uid) not valid;

alter table "public"."cards" validate constraint "cards_owner_fkey";



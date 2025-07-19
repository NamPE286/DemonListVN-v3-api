alter table "public"."orderTracking" add column "delivering" boolean not null default false;

alter table "public"."products" add column "bannerTextColor" text not null default '#FFFFFF'::text;



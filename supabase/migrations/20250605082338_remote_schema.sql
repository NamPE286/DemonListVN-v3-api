alter table "public"."events" add column "isSupporterOnly" boolean not null default false;

alter table "public"."players" add column "isBannerGif" boolean not null default false;



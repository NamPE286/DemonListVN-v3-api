alter table "public"."orders" add column "giftTo" uuid;

alter table "public"."orders" add constraint "orders_giftTo_fkey" FOREIGN KEY ("giftTo") REFERENCES players(uid) not valid;

alter table "public"."orders" validate constraint "orders_giftTo_fkey";



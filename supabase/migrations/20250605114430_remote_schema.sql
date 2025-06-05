alter table "public"."orders" add column "discount" double precision not null default '0'::double precision;

alter table "public"."players" add column "bgColor" text;

alter table "public"."orders" add constraint "orders_discount_check" CHECK ((discount <= (1)::double precision)) not valid;

alter table "public"."orders" validate constraint "orders_discount_check";



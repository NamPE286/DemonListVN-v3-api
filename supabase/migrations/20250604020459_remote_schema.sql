alter table "public"."orders" add column "delivered" boolean not null default false;

alter table "public"."products" alter column "name" set not null;

alter table "public"."products" alter column "price" set not null;



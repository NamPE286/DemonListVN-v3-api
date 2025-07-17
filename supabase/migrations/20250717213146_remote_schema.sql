alter table "public"."orderItems" add column "quantity" bigint not null default '1'::bigint;

alter table "public"."orders" add column "address" text;

alter table "public"."products" add column "stock" bigint;

alter table "public"."orderItems" add constraint "orderItems_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."orderItems" validate constraint "orderItems_quantity_check";

alter table "public"."products" add constraint "products_stock_check" CHECK ((stock >= 0)) not valid;

alter table "public"."products" validate constraint "products_stock_check";



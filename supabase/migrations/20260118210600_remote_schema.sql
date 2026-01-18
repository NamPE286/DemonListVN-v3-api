alter table "public"."inventory" add column "quantity" bigint not null default '1'::bigint;

alter table "public"."items" add column "stackable" boolean not null default false;

alter table "public"."inventory" add constraint "inventory_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."inventory" validate constraint "inventory_quantity_check";



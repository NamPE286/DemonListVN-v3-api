alter table "public"."orderItems" drop constraint "orderItems_orderID_fkey";

alter table "public"."orderItems" drop constraint "orderItems_productID_fkey";

alter table "public"."events" add column "isExternal" boolean not null default false;

alter table "public"."orders" drop column "recipentName";

alter table "public"."orders" add column "recipientName" text;

alter table "public"."orderItems" add constraint "orderItems_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."orderItems" validate constraint "orderItems_orderID_fkey";

alter table "public"."orderItems" add constraint "orderItems_productID_fkey" FOREIGN KEY ("productID") REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."orderItems" validate constraint "orderItems_productID_fkey";



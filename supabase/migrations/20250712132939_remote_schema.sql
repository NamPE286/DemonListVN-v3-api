alter table "public"."coupons" add column "productID" bigint;

alter table "public"."coupons" add column "quantity" bigint not null default '1'::bigint;

alter table "public"."coupons" add constraint "coupons_productID_fkey" FOREIGN KEY ("productID") REFERENCES products(id) not valid;

alter table "public"."coupons" validate constraint "coupons_productID_fkey";



alter table "public"."coupons" alter column "deduct" set default '0'::bigint;

alter table "public"."coupons" alter column "deduct" set not null;

alter table "public"."coupons" alter column "percent" set default '0'::double precision;

alter table "public"."coupons" alter column "percent" set not null;



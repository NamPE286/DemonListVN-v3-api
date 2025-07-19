alter table "public"."orders" alter column "fee" set default '0'::bigint;

alter table "public"."orders" alter column "fee" set not null;



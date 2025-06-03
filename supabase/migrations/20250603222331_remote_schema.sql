alter table "public"."orders" drop column "amount";

alter table "public"."orders" add column "quantity" bigint not null;



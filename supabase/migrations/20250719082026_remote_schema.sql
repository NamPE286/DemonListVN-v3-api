revoke delete on table "public"."deliverySteps" from "anon";

revoke insert on table "public"."deliverySteps" from "anon";

revoke references on table "public"."deliverySteps" from "anon";

revoke select on table "public"."deliverySteps" from "anon";

revoke trigger on table "public"."deliverySteps" from "anon";

revoke truncate on table "public"."deliverySteps" from "anon";

revoke update on table "public"."deliverySteps" from "anon";

revoke delete on table "public"."deliverySteps" from "authenticated";

revoke insert on table "public"."deliverySteps" from "authenticated";

revoke references on table "public"."deliverySteps" from "authenticated";

revoke select on table "public"."deliverySteps" from "authenticated";

revoke trigger on table "public"."deliverySteps" from "authenticated";

revoke truncate on table "public"."deliverySteps" from "authenticated";

revoke update on table "public"."deliverySteps" from "authenticated";

revoke delete on table "public"."deliverySteps" from "service_role";

revoke insert on table "public"."deliverySteps" from "service_role";

revoke references on table "public"."deliverySteps" from "service_role";

revoke select on table "public"."deliverySteps" from "service_role";

revoke trigger on table "public"."deliverySteps" from "service_role";

revoke truncate on table "public"."deliverySteps" from "service_role";

revoke update on table "public"."deliverySteps" from "service_role";

alter table "public"."deliverySteps" drop constraint "deliverySteps_orderID_fkey";

alter table "public"."deliverySteps" drop constraint "deliverySteps_pkey";

drop index if exists "public"."deliverySteps_pkey";

drop table "public"."deliverySteps";

create table "public"."orderTracking" (
    "created_at" timestamp with time zone not null default now(),
    "orderID" bigint not null,
    "id" bigint not null,
    "content" text
);


alter table "public"."orderTracking" enable row level security;

alter table "public"."orders" add column "fee" bigint;

alter table "public"."orders" add column "phone" bigint;

alter table "public"."products" add column "imgCount" bigint;

alter table "public"."products" add column "maxQuantity" bigint;

CREATE UNIQUE INDEX "deliverySteps_pkey" ON public."orderTracking" USING btree (id);

alter table "public"."orderTracking" add constraint "deliverySteps_pkey" PRIMARY KEY using index "deliverySteps_pkey";

alter table "public"."orderTracking" add constraint "deliverySteps_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES orders(id) not valid;

alter table "public"."orderTracking" validate constraint "deliverySteps_orderID_fkey";

grant delete on table "public"."orderTracking" to "anon";

grant insert on table "public"."orderTracking" to "anon";

grant references on table "public"."orderTracking" to "anon";

grant select on table "public"."orderTracking" to "anon";

grant trigger on table "public"."orderTracking" to "anon";

grant truncate on table "public"."orderTracking" to "anon";

grant update on table "public"."orderTracking" to "anon";

grant delete on table "public"."orderTracking" to "authenticated";

grant insert on table "public"."orderTracking" to "authenticated";

grant references on table "public"."orderTracking" to "authenticated";

grant select on table "public"."orderTracking" to "authenticated";

grant trigger on table "public"."orderTracking" to "authenticated";

grant truncate on table "public"."orderTracking" to "authenticated";

grant update on table "public"."orderTracking" to "authenticated";

grant delete on table "public"."orderTracking" to "service_role";

grant insert on table "public"."orderTracking" to "service_role";

grant references on table "public"."orderTracking" to "service_role";

grant select on table "public"."orderTracking" to "service_role";

grant trigger on table "public"."orderTracking" to "service_role";

grant truncate on table "public"."orderTracking" to "service_role";

grant update on table "public"."orderTracking" to "service_role";



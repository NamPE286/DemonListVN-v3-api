create table "public"."coupons" (
    "created_at" timestamp with time zone not null default now(),
    "code" text not null,
    "percent" double precision,
    "deduct" bigint,
    "usageLeft" bigint not null default '1'::bigint,
    "validUntil" timestamp with time zone not null
);


alter table "public"."coupons" enable row level security;

alter table "public"."orders" add column "coupon" text;

CREATE UNIQUE INDEX coupons_pkey ON public.coupons USING btree (code);

alter table "public"."coupons" add constraint "coupons_pkey" PRIMARY KEY using index "coupons_pkey";

alter table "public"."coupons" add constraint "coupons_percent_check" CHECK ((percent <= (1)::double precision)) not valid;

alter table "public"."coupons" validate constraint "coupons_percent_check";

alter table "public"."orders" add constraint "orders_coupon_fkey" FOREIGN KEY (coupon) REFERENCES coupons(code) not valid;

alter table "public"."orders" validate constraint "orders_coupon_fkey";

grant delete on table "public"."coupons" to "anon";

grant insert on table "public"."coupons" to "anon";

grant references on table "public"."coupons" to "anon";

grant select on table "public"."coupons" to "anon";

grant trigger on table "public"."coupons" to "anon";

grant truncate on table "public"."coupons" to "anon";

grant update on table "public"."coupons" to "anon";

grant delete on table "public"."coupons" to "authenticated";

grant insert on table "public"."coupons" to "authenticated";

grant references on table "public"."coupons" to "authenticated";

grant select on table "public"."coupons" to "authenticated";

grant trigger on table "public"."coupons" to "authenticated";

grant truncate on table "public"."coupons" to "authenticated";

grant update on table "public"."coupons" to "authenticated";

grant delete on table "public"."coupons" to "service_role";

grant insert on table "public"."coupons" to "service_role";

grant references on table "public"."coupons" to "service_role";

grant select on table "public"."coupons" to "service_role";

grant trigger on table "public"."coupons" to "service_role";

grant truncate on table "public"."coupons" to "service_role";

grant update on table "public"."coupons" to "service_role";



create table "public"."promotions" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "start" timestamp with time zone not null,
    "end" timestamp with time zone not null,
    "title" text not null,
    "description" text not null,
    "imgUrl" text not null
);


alter table "public"."promotions" enable row level security;

CREATE UNIQUE INDEX promotions_pkey ON public.promotions USING btree (id);

alter table "public"."promotions" add constraint "promotions_pkey" PRIMARY KEY using index "promotions_pkey";

grant delete on table "public"."promotions" to "anon";

grant insert on table "public"."promotions" to "anon";

grant references on table "public"."promotions" to "anon";

grant select on table "public"."promotions" to "anon";

grant trigger on table "public"."promotions" to "anon";

grant truncate on table "public"."promotions" to "anon";

grant update on table "public"."promotions" to "anon";

grant delete on table "public"."promotions" to "authenticated";

grant insert on table "public"."promotions" to "authenticated";

grant references on table "public"."promotions" to "authenticated";

grant select on table "public"."promotions" to "authenticated";

grant trigger on table "public"."promotions" to "authenticated";

grant truncate on table "public"."promotions" to "authenticated";

grant update on table "public"."promotions" to "authenticated";

grant delete on table "public"."promotions" to "service_role";

grant insert on table "public"."promotions" to "service_role";

grant references on table "public"."promotions" to "service_role";

grant select on table "public"."promotions" to "service_role";

grant trigger on table "public"."promotions" to "service_role";

grant truncate on table "public"."promotions" to "service_role";

grant update on table "public"."promotions" to "service_role";



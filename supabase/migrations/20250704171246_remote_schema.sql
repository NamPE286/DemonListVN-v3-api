create table "public"."qualifiers" (
    "created_at" timestamp with time zone not null default now(),
    "userID" uuid not null,
    "levelID" bigint not null,
    "progress" bigint not null
);


alter table "public"."qualifiers" enable row level security;

CREATE UNIQUE INDEX qualifier_pkey ON public.qualifiers USING btree ("userID", "levelID");

alter table "public"."qualifiers" add constraint "qualifier_pkey" PRIMARY KEY using index "qualifier_pkey";

alter table "public"."qualifiers" add constraint "qualifier_userID_fkey" FOREIGN KEY ("userID") REFERENCES players(uid) not valid;

alter table "public"."qualifiers" validate constraint "qualifier_userID_fkey";

grant delete on table "public"."qualifiers" to "anon";

grant insert on table "public"."qualifiers" to "anon";

grant references on table "public"."qualifiers" to "anon";

grant select on table "public"."qualifiers" to "anon";

grant trigger on table "public"."qualifiers" to "anon";

grant truncate on table "public"."qualifiers" to "anon";

grant update on table "public"."qualifiers" to "anon";

grant delete on table "public"."qualifiers" to "authenticated";

grant insert on table "public"."qualifiers" to "authenticated";

grant references on table "public"."qualifiers" to "authenticated";

grant select on table "public"."qualifiers" to "authenticated";

grant trigger on table "public"."qualifiers" to "authenticated";

grant truncate on table "public"."qualifiers" to "authenticated";

grant update on table "public"."qualifiers" to "authenticated";

grant delete on table "public"."qualifiers" to "service_role";

grant insert on table "public"."qualifiers" to "service_role";

grant references on table "public"."qualifiers" to "service_role";

grant select on table "public"."qualifiers" to "service_role";

grant trigger on table "public"."qualifiers" to "service_role";

grant truncate on table "public"."qualifiers" to "service_role";

grant update on table "public"."qualifiers" to "service_role";



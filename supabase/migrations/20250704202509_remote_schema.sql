revoke delete on table "public"."qualifiers" from "anon";

revoke insert on table "public"."qualifiers" from "anon";

revoke references on table "public"."qualifiers" from "anon";

revoke select on table "public"."qualifiers" from "anon";

revoke trigger on table "public"."qualifiers" from "anon";

revoke truncate on table "public"."qualifiers" from "anon";

revoke update on table "public"."qualifiers" from "anon";

revoke delete on table "public"."qualifiers" from "authenticated";

revoke insert on table "public"."qualifiers" from "authenticated";

revoke references on table "public"."qualifiers" from "authenticated";

revoke select on table "public"."qualifiers" from "authenticated";

revoke trigger on table "public"."qualifiers" from "authenticated";

revoke truncate on table "public"."qualifiers" from "authenticated";

revoke update on table "public"."qualifiers" from "authenticated";

revoke delete on table "public"."qualifiers" from "service_role";

revoke insert on table "public"."qualifiers" from "service_role";

revoke references on table "public"."qualifiers" from "service_role";

revoke select on table "public"."qualifiers" from "service_role";

revoke trigger on table "public"."qualifiers" from "service_role";

revoke truncate on table "public"."qualifiers" from "service_role";

revoke update on table "public"."qualifiers" from "service_role";

alter table "public"."qualifiers" drop constraint "qualifier_userID_fkey";

alter table "public"."qualifiers" drop constraint "qualifier_pkey";

drop index if exists "public"."qualifier_pkey";

drop table "public"."qualifiers";

create table "public"."eventRecords" (
    "created_at" timestamp with time zone not null default now(),
    "userID" uuid not null,
    "levelID" bigint not null,
    "progress" bigint not null,
    "eventID" bigint not null
);


alter table "public"."eventRecords" enable row level security;

CREATE UNIQUE INDEX "eventRecords_pkey" ON public."eventRecords" USING btree ("userID", "levelID", "eventID");

alter table "public"."eventRecords" add constraint "eventRecords_pkey" PRIMARY KEY using index "eventRecords_pkey";

alter table "public"."eventRecords" add constraint "eventRecords_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES events(id) not valid;

alter table "public"."eventRecords" validate constraint "eventRecords_eventID_fkey";

alter table "public"."eventRecords" add constraint "qualifier_userID_fkey" FOREIGN KEY ("userID") REFERENCES players(uid) not valid;

alter table "public"."eventRecords" validate constraint "qualifier_userID_fkey";

grant delete on table "public"."eventRecords" to "anon";

grant insert on table "public"."eventRecords" to "anon";

grant references on table "public"."eventRecords" to "anon";

grant select on table "public"."eventRecords" to "anon";

grant trigger on table "public"."eventRecords" to "anon";

grant truncate on table "public"."eventRecords" to "anon";

grant update on table "public"."eventRecords" to "anon";

grant delete on table "public"."eventRecords" to "authenticated";

grant insert on table "public"."eventRecords" to "authenticated";

grant references on table "public"."eventRecords" to "authenticated";

grant select on table "public"."eventRecords" to "authenticated";

grant trigger on table "public"."eventRecords" to "authenticated";

grant truncate on table "public"."eventRecords" to "authenticated";

grant update on table "public"."eventRecords" to "authenticated";

grant delete on table "public"."eventRecords" to "service_role";

grant insert on table "public"."eventRecords" to "service_role";

grant references on table "public"."eventRecords" to "service_role";

grant select on table "public"."eventRecords" to "service_role";

grant trigger on table "public"."eventRecords" to "service_role";

grant truncate on table "public"."eventRecords" to "service_role";

grant update on table "public"."eventRecords" to "service_role";



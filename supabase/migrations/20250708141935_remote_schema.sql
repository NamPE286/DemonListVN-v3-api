revoke delete on table "public"."playerMedal" from "anon";

revoke insert on table "public"."playerMedal" from "anon";

revoke references on table "public"."playerMedal" from "anon";

revoke select on table "public"."playerMedal" from "anon";

revoke trigger on table "public"."playerMedal" from "anon";

revoke truncate on table "public"."playerMedal" from "anon";

revoke update on table "public"."playerMedal" from "anon";

revoke delete on table "public"."playerMedal" from "authenticated";

revoke insert on table "public"."playerMedal" from "authenticated";

revoke references on table "public"."playerMedal" from "authenticated";

revoke select on table "public"."playerMedal" from "authenticated";

revoke trigger on table "public"."playerMedal" from "authenticated";

revoke truncate on table "public"."playerMedal" from "authenticated";

revoke update on table "public"."playerMedal" from "authenticated";

revoke delete on table "public"."playerMedal" from "service_role";

revoke insert on table "public"."playerMedal" from "service_role";

revoke references on table "public"."playerMedal" from "service_role";

revoke select on table "public"."playerMedal" from "service_role";

revoke trigger on table "public"."playerMedal" from "service_role";

revoke truncate on table "public"."playerMedal" from "service_role";

revoke update on table "public"."playerMedal" from "service_role";

alter table "public"."playerMedal" drop constraint "playerMedal_medalID_fkey";

alter table "public"."playerMedal" drop constraint "playerMedal_userID_fkey";

alter table "public"."playerMedal" drop constraint "playerMedal_pkey";

drop index if exists "public"."playerMedal_pkey";

drop table "public"."playerMedal";

create table "public"."playerMedals" (
    "userID" uuid not null,
    "medalID" bigint not null,
    "content" text
);


alter table "public"."playerMedals" enable row level security;

CREATE UNIQUE INDEX "playerMedal_pkey" ON public."playerMedals" USING btree ("userID", "medalID");

alter table "public"."playerMedals" add constraint "playerMedal_pkey" PRIMARY KEY using index "playerMedal_pkey";

alter table "public"."playerMedals" add constraint "playerMedal_medalID_fkey" FOREIGN KEY ("medalID") REFERENCES medals(id) not valid;

alter table "public"."playerMedals" validate constraint "playerMedal_medalID_fkey";

alter table "public"."playerMedals" add constraint "playerMedal_userID_fkey" FOREIGN KEY ("userID") REFERENCES players(uid) not valid;

alter table "public"."playerMedals" validate constraint "playerMedal_userID_fkey";

grant delete on table "public"."playerMedals" to "anon";

grant insert on table "public"."playerMedals" to "anon";

grant references on table "public"."playerMedals" to "anon";

grant select on table "public"."playerMedals" to "anon";

grant trigger on table "public"."playerMedals" to "anon";

grant truncate on table "public"."playerMedals" to "anon";

grant update on table "public"."playerMedals" to "anon";

grant delete on table "public"."playerMedals" to "authenticated";

grant insert on table "public"."playerMedals" to "authenticated";

grant references on table "public"."playerMedals" to "authenticated";

grant select on table "public"."playerMedals" to "authenticated";

grant trigger on table "public"."playerMedals" to "authenticated";

grant truncate on table "public"."playerMedals" to "authenticated";

grant update on table "public"."playerMedals" to "authenticated";

grant delete on table "public"."playerMedals" to "service_role";

grant insert on table "public"."playerMedals" to "service_role";

grant references on table "public"."playerMedals" to "service_role";

grant select on table "public"."playerMedals" to "service_role";

grant trigger on table "public"."playerMedals" to "service_role";

grant truncate on table "public"."playerMedals" to "service_role";

grant update on table "public"."playerMedals" to "service_role";



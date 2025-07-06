create table "public"."eventLevels" (
    "eventID" bigint not null,
    "levelID" bigint not null,
    "point" bigint not null,
    "needRaw" boolean not null
);


alter table "public"."eventLevels" enable row level security;

alter table "public"."eventRecords" add column "raw" text;

alter table "public"."eventRecords" add column "videoLink" text not null;

alter table "public"."eventRecords" alter column "progress" set data type double precision using "progress"::double precision;

alter table "public"."events" add column "isContest" boolean not null default false;

alter table "public"."levels" add column "isNonList" boolean not null default false;

CREATE UNIQUE INDEX "eventLevels_pkey" ON public."eventLevels" USING btree ("eventID", "levelID");

alter table "public"."eventLevels" add constraint "eventLevels_pkey" PRIMARY KEY using index "eventLevels_pkey";

alter table "public"."eventLevels" add constraint "eventLevels_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES events(id) not valid;

alter table "public"."eventLevels" validate constraint "eventLevels_eventID_fkey";

alter table "public"."eventLevels" add constraint "eventLevels_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES levels(id) not valid;

alter table "public"."eventLevels" validate constraint "eventLevels_levelID_fkey";

grant delete on table "public"."eventLevels" to "anon";

grant insert on table "public"."eventLevels" to "anon";

grant references on table "public"."eventLevels" to "anon";

grant select on table "public"."eventLevels" to "anon";

grant trigger on table "public"."eventLevels" to "anon";

grant truncate on table "public"."eventLevels" to "anon";

grant update on table "public"."eventLevels" to "anon";

grant delete on table "public"."eventLevels" to "authenticated";

grant insert on table "public"."eventLevels" to "authenticated";

grant references on table "public"."eventLevels" to "authenticated";

grant select on table "public"."eventLevels" to "authenticated";

grant trigger on table "public"."eventLevels" to "authenticated";

grant truncate on table "public"."eventLevels" to "authenticated";

grant update on table "public"."eventLevels" to "authenticated";

grant delete on table "public"."eventLevels" to "service_role";

grant insert on table "public"."eventLevels" to "service_role";

grant references on table "public"."eventLevels" to "service_role";

grant select on table "public"."eventLevels" to "service_role";

grant trigger on table "public"."eventLevels" to "service_role";

grant truncate on table "public"."eventLevels" to "service_role";

grant update on table "public"."eventLevels" to "service_role";



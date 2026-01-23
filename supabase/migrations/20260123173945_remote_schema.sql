
  create table "public"."battlePassMapPackLevelProgress" (
    "created_at" timestamp with time zone not null default now(),
    "battlePassMapPackId" bigint not null,
    "levelID" bigint not null,
    "userID" uuid not null,
    "progress" bigint not null default '0'::bigint
      );


alter table "public"."battlePassMapPackLevelProgress" enable row level security;

CREATE INDEX "battlePassMapPackLevelProgress_battlePassMapPackId_idx" ON public."battlePassMapPackLevelProgress" USING btree ("battlePassMapPackId");

CREATE UNIQUE INDEX "battlePassMapPackLevelProgress_pkey" ON public."battlePassMapPackLevelProgress" USING btree ("battlePassMapPackId", "levelID", "userID");

CREATE INDEX "battlePassMapPackLevelProgress_userID_idx" ON public."battlePassMapPackLevelProgress" USING btree ("userID");

alter table "public"."battlePassMapPackLevelProgress" add constraint "battlePassMapPackLevelProgress_pkey" PRIMARY KEY using index "battlePassMapPackLevelProgress_pkey";

alter table "public"."battlePassMapPackLevelProgress" add constraint "battlePassMapPackLevelProgress_battlePassMapPackId_fkey" FOREIGN KEY ("battlePassMapPackId") REFERENCES public."battlePassMapPacks"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMapPackLevelProgress" validate constraint "battlePassMapPackLevelProgress_battlePassMapPackId_fkey";

alter table "public"."battlePassMapPackLevelProgress" add constraint "battlePassMapPackLevelProgress_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMapPackLevelProgress" validate constraint "battlePassMapPackLevelProgress_userID_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_event_leaderboard(event_id integer)
 RETURNS TABLE("userID" uuid, elo bigint, "matchCount" bigint, point numeric, penalty numeric)
 LANGUAGE plpgsql
AS $function$BEGIN
  RETURN QUERY
  SELECT
    er."userID",
    p.elo,
    p."matchCount",
    COALESCE(SUM((er.progress::numeric * el.point::numeric) / 100), 0) AS point,
    SUM(
      EXTRACT(EPOCH FROM (er.created_at - e.start)) / 60
    ) AS penalty
  FROM
    "eventRecords" AS er
    JOIN "eventLevels" AS el ON er."levelID" = el.id
    JOIN events AS e ON e.id = el."eventID"
    JOIN players AS p ON p.uid = er."userID"
  WHERE
    el."eventID" = event_id
  GROUP BY
    er."userID",
    p."elo",
    p."matchCount"
  ORDER BY
    point DESC,
    penalty ASC;
END;$function$
;

grant delete on table "public"."battlePassMapPackLevelProgress" to "anon";

grant insert on table "public"."battlePassMapPackLevelProgress" to "anon";

grant references on table "public"."battlePassMapPackLevelProgress" to "anon";

grant select on table "public"."battlePassMapPackLevelProgress" to "anon";

grant trigger on table "public"."battlePassMapPackLevelProgress" to "anon";

grant truncate on table "public"."battlePassMapPackLevelProgress" to "anon";

grant update on table "public"."battlePassMapPackLevelProgress" to "anon";

grant delete on table "public"."battlePassMapPackLevelProgress" to "authenticated";

grant insert on table "public"."battlePassMapPackLevelProgress" to "authenticated";

grant references on table "public"."battlePassMapPackLevelProgress" to "authenticated";

grant select on table "public"."battlePassMapPackLevelProgress" to "authenticated";

grant trigger on table "public"."battlePassMapPackLevelProgress" to "authenticated";

grant truncate on table "public"."battlePassMapPackLevelProgress" to "authenticated";

grant update on table "public"."battlePassMapPackLevelProgress" to "authenticated";

grant delete on table "public"."battlePassMapPackLevelProgress" to "service_role";

grant insert on table "public"."battlePassMapPackLevelProgress" to "service_role";

grant references on table "public"."battlePassMapPackLevelProgress" to "service_role";

grant select on table "public"."battlePassMapPackLevelProgress" to "service_role";

grant trigger on table "public"."battlePassMapPackLevelProgress" to "service_role";

grant truncate on table "public"."battlePassMapPackLevelProgress" to "service_role";

grant update on table "public"."battlePassMapPackLevelProgress" to "service_role";



drop function if exists "public"."getEventLeaderboard"(event_id integer);

alter table "public"."players" add column "matchCount" bigint not null default '0'::bigint;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public."getEventLeaderboard"(event_id integer)
 RETURNS TABLE("userID" uuid, elo integer, "matchCount" integer, point numeric)
 LANGUAGE sql
 STABLE
AS $function$
    SELECT
        er."userID",
        p."elo",
        p."matchCount",
        COALESCE(
            SUM((er.progress::numeric * el.point::numeric) / 100),
            0
        ) AS point
    FROM public."eventRecords" er
    JOIN public."eventLevels" el ON er."levelID" = el.id
    JOIN public."players" p ON p.uid = er."userID"
    WHERE el."eventID" = event_id
    GROUP BY er."userID", p."elo", p."matchCount"
    ORDER BY point DESC;
$function$
;



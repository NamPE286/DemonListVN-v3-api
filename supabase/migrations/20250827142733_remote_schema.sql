drop function if exists "public"."getEventLeaderboard"(event_id integer);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public."getEventLeaderboard"(event_id integer)
 RETURNS TABLE("userID" uuid, elo bigint, point numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
SELECT 
    er."userID",
    p."elo",
    COALESCE(SUM((er.progress::numeric * el.point::numeric) / 100), 0) AS point
FROM public."eventRecords" AS er
JOIN public."eventLevels"  AS el
    ON er."levelID" = el.id
JOIN public."players" AS p
    ON p.uid = er."userID"
WHERE el."eventID" = 14
GROUP BY er."userID", p."elo"
ORDER BY point DESC;
END;
$function$
;



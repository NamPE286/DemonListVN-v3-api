set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public."getEventLeaderboard"(event_id integer)
 RETURNS record
 LANGUAGE plpgsql
AS $function$begin
  SELECT er."userID",
         COALESCE(SUM( (er.progress::numeric * el.point::numeric) / 100 ), 0) AS total_points
  FROM public."eventRecords" AS er
  JOIN public."eventLevels"  AS el ON er."levelID" = el.id
  WHERE el."eventID" = event_id
  GROUP BY er."userID"
  ORDER BY total_points DESC;
end$function$
;



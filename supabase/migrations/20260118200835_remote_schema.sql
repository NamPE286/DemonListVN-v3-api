set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_queue_no(userid uuid, levelid bigint, p bigint)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$DECLARE
  target_ts BIGINT;
  result_no BIGINT;
BEGIN
  select no
  into result_no
  from (
    select
      case
        when players."supporterUntil" is not null
         and players."supporterUntil" > now()
          then records."timestamp" - 2592000000 - records."prioritizedBy"
        else records."timestamp" - records."prioritizedBy"
      end as ts,
      records."queueNo" as no
    from records
    join players on records.userid = players.uid
    where records."queueNo" is not null
  ) t
  where ts <= (
    select
      case
        when players."supporterUntil" is not null
         and players."supporterUntil" > now()
          then records."timestamp" - 2592000000 - records."prioritizedBy" - p
        else records."timestamp" - records."prioritizedBy" - p
      end
    from records
    join players on records.userid = players.uid
    where records.userid = get_queue_no.userid
      and records.levelid = get_queue_no.levelid
    limit 1
  )
  order by ts desc
  limit 1;

  return result_no;
END;$function$
;



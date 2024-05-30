alter table "public"."players" add column "isTrusted" boolean not null default false;

alter table "public"."players" add column "reviewCooldown" timestamp with time zone;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public."updateList"()
 RETURNS void
 LANGUAGE plpgsql
AS $function$begin
WITH
  v_table_name AS (
    SELECT
      id,
      (
        case
          when "flTop" is not null then RANK() OVER (
            ORDER BY
              "flTop" asc nulls last
          )
        end
      ) as ab
    FROM
      levels
  )
UPDATE
  levels
set
  "flTop" = v_table_name.ab
FROM
  v_table_name
WHERE
  levels.id = v_table_name.id;

WITH
  v_table_name AS (
    SELECT
      id,
      (
        case
          when "rating" is not null then RANK() OVER (
            ORDER BY
              "rating" desc nulls last
          )
        end
      ) as ab
    FROM
      levels
  )
UPDATE
  levels
set
  "dlTop" = v_table_name.ab
FROM
  v_table_name
WHERE
  levels.id = v_table_name.id;

UPDATE
  levels
SET
  "flPt" = cast(
    2250 / (0.4 * ("flTop") + 7) - 55 as decimal(16, 2)
  )
where
  "flTop" < 76;

UPDATE
  levels
SET
  "flPt" = 1
where
  "flTop" > 75;

UPDATE levels
SET "minProgress" = least(greatest(0, 100 - (rating - 1783) / 40), 100)
where true;
end$function$
;

CREATE OR REPLACE FUNCTION public."updateRank"()
 RETURNS void
 LANGUAGE plpgsql
AS $function$begin
UPDATE records 
    SET "flPt" = cast((
        select "flPt" from levels
        where levels.id = records.levelid
    ) as decimal(16,2))
    where progress = 100;

UPDATE records 
    SET "dlPt" = cast((
        select rating from levels
        where levels.id = records.levelid
    ) as decimal(16,2))
    where progress = 100;

UPDATE records 
    SET "dlPt" = cast((
        select rating from levels
        where levels.id = records.levelid
    ) * progress / 150 as decimal(16,2))
    where progress < 100;

update players
    set "totalFLpt" = (
        select sum("flPt") from records where records.userid = players.uid and records."isChecked" = true
    )
    where true;
update players
    set "totalDLpt" = (
        select sum("dlPt") from records where records.userid = players.uid and records."isChecked" = true
    )
    where true;

update players
	set "dlMaxPt" = greatest((select max("dlPt") from records where records.userid = players.uid and records."isChecked" = true), -1)
	where true;
update players
	set "flMaxPt" = greatest((select max("flPt") from records where records.userid = players.uid and records."isChecked" = true), -1)
	where true;
update players
	set rating = cast((greatest("dlMaxPt", 0) + (greatest("totalDLpt", 0)*25 / "dlMaxPt")) as decimal(16, 0))
	where true;

update players
	set rating = null
	where "isHidden";

WITH v_table_name AS
(
    SELECT uid, (case when "totalFLpt" is not null
                then RANK() OVER (ORDER BY "totalFLpt" desc nulls last) end) as ab
    FROM players
) 
UPDATE players set "flrank" = v_table_name.ab
FROM v_table_name
WHERE players.uid = v_table_name.uid;

WITH v_table_name AS
(
    SELECT uid, (case when "totalDLpt" is not null
                then RANK() OVER (ORDER BY "totalDLpt" desc nulls last) end) as ab
    FROM players
) 
UPDATE players set "dlrank" = v_table_name.ab
FROM v_table_name
WHERE players.uid = v_table_name.uid;

WITH v_table_name AS
(
    SELECT uid, (case when "rating" is not null and "rating" != 0
                then RANK() OVER (ORDER BY "rating" desc nulls last) end) as ab
    FROM players
) 
UPDATE players set "overallRank" = v_table_name.ab
FROM v_table_name
WHERE players.uid = v_table_name.uid;
end$function$
;



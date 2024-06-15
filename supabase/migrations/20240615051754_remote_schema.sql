alter table "public"."clans" add column "memberLimit" bigint not null default '50'::bigint;

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

update clans
set "memberCount" = (select count(*) from players where players.clan = clans.id)
where true;
end$function$
;



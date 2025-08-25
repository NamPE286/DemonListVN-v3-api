alter table "public"."clans" add column "boostedUntil" timestamp with time zone not null default now();

alter table "public"."clans" add column "homeContent" text;

alter table "public"."orders" add column "targetClanID" bigint;

CREATE UNIQUE INDEX levels_id_key ON public.levels USING btree (id);

alter table "public"."levels" add constraint "levels_id_key" UNIQUE using index "levels_id_key";

alter table "public"."orders" add constraint "orders_targetClanID_fkey" FOREIGN KEY ("targetClanID") REFERENCES clans(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_targetClanID_fkey";

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
      "isPlatformer",
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
    where "isPlatformer" = false
  )
UPDATE
  levels
set
  "dlTop" = v_table_name.ab
FROM
  v_table_name
WHERE
  levels.id = v_table_name.id;

WITH
  v_table_name AS (
    SELECT
      id,
      "isPlatformer",
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
    where "isPlatformer" = true
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

update clans
set "memberCount" = (select count(*) from players where players.clan = clans.id)
where true;

update levels set "flPt" = null where "flTop" is null;
update levels set "dlTop" = null where "rating" is null;
end$function$
;



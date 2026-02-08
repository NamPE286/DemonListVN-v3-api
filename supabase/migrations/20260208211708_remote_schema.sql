alter table "public"."levelSubmissions" drop constraint "levelSubmissions_levelId_fkey";

alter table "public"."levels" alter column "creator" drop default;

alter table "public"."levels" alter column "creator" set data type text using "creator"::text;

alter table "public"."levelSubmissions" add constraint "levelSubmissions_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES public.levels(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."levelSubmissions" validate constraint "levelSubmissions_levelId_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_community_post_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only update updated_at when content-related fields change
    IF (
        OLD.title IS DISTINCT FROM NEW.title OR
        OLD.content IS DISTINCT FROM NEW.content OR
        OLD.type IS DISTINCT FROM NEW.type OR
        OLD.image_url IS DISTINCT FROM NEW.image_url OR
        OLD.video_url IS DISTINCT FROM NEW.video_url OR
        OLD.attached_record IS DISTINCT FROM NEW.attached_record OR
        OLD.attached_level IS DISTINCT FROM NEW.attached_level OR
        OLD.is_recommended IS DISTINCT FROM NEW.is_recommended
    ) THEN
        NEW.updated_at = now();
    ELSE
        NEW.updated_at = OLD.updated_at;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_list()
 RETURNS void
 LANGUAGE plpgsql
AS $function$begin
with
  v_table_name as (
    select
      id,
      (
        case
          when "flTop" is not null then RANK() over (
            order by
              "flTop" asc nulls last
          )
        end
      ) as ab
    from
      levels
  )
update levels
set
  "flTop" = v_table_name.ab
from
  v_table_name
where
  levels.id = v_table_name.id
  and levels."isNonList" = false;

with
  v_table_name as (
    select
      id,
      "isPlatformer",
      (
        case
          when "rating" is not null then RANK() over (
            order by
              "rating" desc nulls last
          )
        end
      ) as ab
    from
      levels
    where
      "isPlatformer" = false
      and "isChallenge" = false
      and levels."isNonList" = false
  )
update levels
set
  "dlTop" = v_table_name.ab
from
  v_table_name
where
  levels.id = v_table_name.id
  and levels."isNonList" = false;

with
  v_table_name as (
    select
      id,
      "isPlatformer",
      (
        case
          when "rating" is not null then RANK() over (
            order by
              "rating" desc nulls last
          )
        end
      ) as ab
    from
      levels
    where
      "isPlatformer" = true
      and "isChallenge" = false
      and levels."isNonList" = false
  )
update levels
set
  "dlTop" = v_table_name.ab
from
  v_table_name
where
  levels.id = v_table_name.id
  and levels."isNonList" = false;

with
  v_table_name as (
    select
      id,
      "isChallenge",
      (
        case
          when "rating" is not null then RANK() over (
            order by
              "rating" desc nulls last
          )
        end
      ) as ab
    from
      levels
    where
      "isChallenge" = true
      and levels."isNonList" = false
  )
update levels
set
  "dlTop" = v_table_name.ab
from
  v_table_name
where
  levels.id = v_table_name.id
  and levels."isNonList" = false;

update levels
set
  "flPt" = cast(
    2250 / (0.4 * ("flTop") + 7) - 55 as decimal(16, 2)
  )
where
  "flTop" < 76;

update levels
set
  "flPt" = 1
where
  "flTop" > 75;

update clans
set
  "memberCount" = (
    select
      count(*)
    from
      players
    where
      players.clan = clans.id
  )
where
  true;

update levels
set
  "flPt" = null
where
  "flTop" is null;

update levels
set
  "dlTop" = null
where
  "rating" is null;
end$function$
;



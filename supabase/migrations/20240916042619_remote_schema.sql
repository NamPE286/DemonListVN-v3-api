alter table "public"."eventProofs" drop constraint "eventProof_eventID_fkey";

alter table "public"."eventProofs" drop constraint "eventProof_userid_fkey";

alter table "public"."notifications" enable row level security;

alter table "public"."players" add column "extraExp" bigint;

alter table "public"."eventProofs" add constraint "eventProofs_content_check" CHECK ((length(content) > 0)) not valid;

alter table "public"."eventProofs" validate constraint "eventProofs_content_check";

alter table "public"."eventProofs" add constraint "eventProofs_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES events(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."eventProofs" validate constraint "eventProofs_eventID_fkey";

alter table "public"."eventProofs" add constraint "eventProofs_userid_fkey" FOREIGN KEY (userid) REFERENCES players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."eventProofs" validate constraint "eventProofs_userid_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public."updateRank"()
 RETURNS void
 LANGUAGE plpgsql
AS $function$begin
with
  v_table_a as (
    SELECT
      records.userid,
      records.levelid,
      records."dlPt",
      levels.rating,
      case
        when records."isChecked" = false then null
        else rank() over (
          partition by
            userid
          order by
            case
              when records.progress = 100 then levels.rating
              else levels.rating * records.progress / 150
            end desc nulls last
        )
      end as no
    FROM
      records,
      levels
    where
      levels.id = records.levelid
  )
update records
set
  no = v_table_a.no
from
  v_table_a
where
  records.userid = v_table_a.userid
  and records.levelid = v_table_a.levelid
  and v_table_a.rating is not null;

UPDATE records
SET
  "flPt" = cast(
    (
      select
        "flPt"
      from
        levels
      where
        levels.id = records.levelid
    ) as decimal(16, 2)
  )
where
  progress = 100;

with
  v_b as (
    SELECT
      records.userid,
      records.levelid,
      case
        when records.no is null then null
        when records.no = 1 then levels.rating * 7 / 10
        when (
          records.no > 1
          and records.no <= 20
        ) then greatest(5, floor(levels.rating * (25 / records.no) / 100))
        when (
          records.no > 20
          and records.no <= 50
        ) then 5
        else 1
      end as pt
    FROM
      records,
      levels
    where
      levels.id = records.levelid
  )
update records
set
  "dlPt" = v_b.pt
from
  v_b
where
  records.userid = v_b.userid
  and records.levelid = v_b.levelid
  and records.progress = 100;

with
  v_b as (
    SELECT
      records.userid,
      records.levelid,
      case
        when records.no is null then null
        when records.no = 1 then levels.rating * 7 / 10
        when (
          records.no > 1
          and records.no <= 20
        ) then greatest(5, floor(levels.rating * (25 / records.no) / 100))
        when (
          records.no > 20
          and records.no <= 50
        ) then 5
        else 1
      end as pt
    FROM
      records,
      levels
    where
      levels.id = records.levelid
  )
update records
set
  "dlPt" = v_b.pt * progress / 150
from
  v_b
where
  records.userid = v_b.userid
  and records.levelid = v_b.levelid
  and records.progress < 100;

update players
set
  "totalFLpt" = (
    select
      sum("flPt")
    from
      records
    where
      records.userid = players.uid
      and records."isChecked" = true
  )
where
  true;

update players
set
  "totalDLpt" = (
    select
      sum("dlPt")
    from
      records
    where
      records.userid = players.uid
      and records."isChecked" = true
  )
where
  true;

update players
set
  "dlMaxPt" = greatest(
    (
      select
        max("dlPt")
      from
        records
      where
        records.userid = players.uid
        and records."isChecked" = true
    ),
    -1
  )
where
  true;

update players
set
  "flMaxPt" = greatest(
    (
      select
        max("flPt")
      from
        records
      where
        records.userid = players.uid
        and records."isChecked" = true
    ),
    -1
  )
where
  true;

update players
set
  rating = cast(
    (
      select
        sum("dlPt")
      from
        records
      where
        records.userid = players.uid
        and records."isChecked" = true
    ) as integer
  )
where
  true;

update players
set
  rating = null
where
  "isHidden";

WITH
  v_table_name AS (
    SELECT
      uid,
      (
        case
          when "totalFLpt" is not null then RANK() OVER (
            ORDER BY
              "totalFLpt" desc nulls last
          )
        end
      ) as ab
    FROM
      players
  )
UPDATE players
set
  "flrank" = v_table_name.ab
FROM
  v_table_name
WHERE
  players.uid = v_table_name.uid;

WITH
  v_table_name AS (
    SELECT
      uid,
      (
        case
          when "totalDLpt" is not null then RANK() OVER (
            ORDER BY
              "totalDLpt" desc nulls last
          )
        end
      ) as ab
    FROM
      players
  )
UPDATE players
set
  "dlrank" = v_table_name.ab
FROM
  v_table_name
WHERE
  players.uid = v_table_name.uid;

WITH
  v_table_name AS (
    SELECT
      uid,
      (
        case
          when "rating" is not null
          and "rating" != 0 then RANK() OVER (
            ORDER BY
              "rating" desc nulls last
          )
        end
      ) as ab
    FROM
      players
  )
UPDATE players
set
  "overallRank" = v_table_name.ab
FROM
  v_table_name
WHERE
  players.uid = v_table_name.uid;

with
  v_table_a as (
    select
      userid,
      count(*)
    from
      records
    where
      "isChecked" = true
    group by
      userid
  )
update players
set
  "recordCount" = v_table_a.count
from
  v_table_a
where
  players.uid = v_table_a.userid;

with
  v_table_a as (
    select
      records.userid,
      coalesce(sum(levels.rating), 0) as sum,
      count(*)
    from
      records,
      levels
    where
      levels.id = records.levelid
    group by
      records.userid
  )
update players
set
  exp = v_table_a.count * 50 + v_table_a.sum
from
  v_table_a
where
  uid = v_table_a.userid;

update players
set "extraExp" = 0;

with
  v_table_a as (
    select
      "eventProofs".userid,
      sum(events.exp)
    from
      events,
      "eventProofs"
    where
      events.id = "eventProofs"."eventID"
      and "eventProofs".accepted = true
    group by
      "eventProofs".userid
  )
update players
set
  "extraExp" = v_table_a.sum
from
  v_table_a
where
  players.uid = v_table_a.userid;
end$function$
;

create policy "Enable read access for all users"
on "public"."notifications"
as permissive
for select
to public
using (true);



alter table "public"."eventLevels" drop column "hp";

alter table "public"."eventLevels" add column "dmgTaken" bigint default '0'::bigint;

alter table "public"."players" alter column "uid" set default extensions.uuid_generate_v4();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public."getEventLeaderboard"(event_id integer)
 RETURNS TABLE("userID" uuid, elo bigint, "matchCount" bigint, point numeric, penalty numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
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
END;
$function$
;

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

CREATE OR REPLACE FUNCTION public."updateRank"()
 RETURNS void
 LANGUAGE plpgsql
AS $function$begin
update players
set
  "isHidden" = true
where
  "isBanned" = true;
  
with
  v_table_a as (
    select
      records.userid,
      records.levelid,
      records."dlPt",
      levels.rating,
      rank() over (
        partition by
          userid
        order by
          case
            when records."isChecked" = false then null
            when records.progress = 100 then levels.rating
            else levels.rating * records.progress / 150
          end desc nulls last,
          levels.name
      ) as no
    from
      records,
      levels
    where
      levels.id = records.levelid
      and levels."isPlatformer" = false
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

update records
set
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
    select
      records.userid,
      records.levelid,
      case
        when records.no is null then null
        when records.no = 1 then levels.rating * 5 / 10
        when records.no = 2 then levels.rating * 3 / 10
        when records.no = 3 then levels.rating * 2 / 10
        when (
          records.no > 3
          and records.no <= 15
        ) then greatest(
          5,
          floor(levels.rating * (25.0 / records.no) / 100)
        )
        when (
          records.no > 15
          and records.no <= 25
        ) then 5
        else 1
      end as pt
    from
      records,
      levels
    where
      levels.id = records.levelid
      and levels."isPlatformer" = false
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
    select
      records.userid,
      records.levelid,
      case
        when records.no is null then null
        when records.no = 1 then levels.rating * 5 / 10
        when records.no = 2 then levels.rating * 3 / 10
        when records.no = 3 then levels.rating * 2 / 10
        when (
          records.no > 1
          and records.no <= 15
        ) then greatest(
          5,
          floor(levels.rating * (25.0 / records.no) / 100)
        )
        when (
          records.no > 15
          and records.no <= 25
        ) then 5
        else 1
      end as pt
    from
      records,
      levels
    where
      levels.id = records.levelid
      and levels."isPlatformer" = false
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

with
  v_table_name as (
    select
      uid,
      (
        case
          when "totalFLpt" is not null then RANK() over (
            order by
              "totalFLpt" desc nulls last
          )
        end
      ) as ab
    from
      players
  )
update players
set
  "flrank" = v_table_name.ab
from
  v_table_name
where
  players.uid = v_table_name.uid;

with
  v_table_name as (
    select
      uid,
      (
        case
          when "totalDLpt" is not null then RANK() over (
            order by
              "totalDLpt" desc nulls last
          )
        end
      ) as ab
    from
      players
  )
update players
set
  "dlrank" = v_table_name.ab
from
  v_table_name
where
  players.uid = v_table_name.uid;

with
  v_table_name as (
    select
      uid,
      (
        case
          when "rating" is not null
          and "rating" != 0 then RANK() over (
            order by
              "rating" desc nulls last
          )
        end
      ) as ab
    from
      players
  )
update players
set
  "overallRank" = v_table_name.ab
from
  v_table_name
where
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
      and records."isChecked" = true
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
set
  "extraExp" = 0
where
  true;

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

update records
set
  "queueNo" = null
where
  true;

with
  RankedRecords as (
    select
      ROW_NUMBER() over (
        order by
          case
            when p."supporterUntil" is null then r.timestamp
            when p."supporterUntil" > NOW() then (r.timestamp - 2592000000)::int8
            else r.timestamp
          end
      ) as "queueNo",
      r.userid,
      r.levelid,
      r."isChecked",
      r."needMod",
      r."reviewer",
      p."supporterUntil"
    from
      public.records r
      join public.players p on r.userid = p.uid
    where
      r."isChecked" = false
      and r."needMod" = false
      and r."reviewer" is null
  )
update records
set
  "queueNo" = RankedRecords."queueNo"
from
  RankedRecords
where
  records.userid = RankedRecords.userid
  and records.levelid = RankedRecords.levelid;
end$function$
;

CREATE OR REPLACE FUNCTION public.update_supporter_until()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    user_record RECORD;
    order_record RECORD;
    current_supporter_until TIMESTAMP;
BEGIN
    -- Lặp qua từng user có đơn hàng
    FOR user_record IN 
        SELECT DISTINCT COALESCE("giftTo", "userID") as target_uid
        FROM orders 
        WHERE "productID" = 1 AND delivered = true
    LOOP
        current_supporter_until := NULL;
        
        -- Xử lý từng đơn hàng theo thứ tự thời gian
        FOR order_record IN 
            SELECT created_at, quantity
            FROM orders 
            WHERE "productID" = 1 AND delivered = true
            AND COALESCE("giftTo", "userID") = user_record.target_uid
            ORDER BY created_at
        LOOP
            IF current_supporter_until IS NULL OR current_supporter_until < order_record.created_at THEN
                -- Nếu chưa có hoặc đã hết hạn supporter
                current_supporter_until := order_record.created_at + INTERVAL '1 month' * order_record.quantity;
            ELSE
                -- Nếu vẫn còn supporter, cộng thêm thời gian
                current_supporter_until := current_supporter_until + INTERVAL '1 month' * order_record.quantity;
            END IF;
        END LOOP;
        
        -- Cập nhật vào database
        UPDATE players 
        SET "supporterUntil" = current_supporter_until
        WHERE uid = user_record.target_uid;
    END LOOP;
END;
$function$
;



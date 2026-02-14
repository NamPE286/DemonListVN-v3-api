alter table "public"."playerConvictions" add column "creditReduce" bigint not null default '0'::bigint;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_event_levels_progress(updates jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    UPDATE "eventLevels"
    SET "totalProgress" = "totalProgress" + (item->>'gained')::float
    WHERE "id" = (item->>'level_id')::int;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_hide_reported_content()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    report_count integer;
BEGIN
    -- Count unresolved reports for this content in the last 24 hours
    IF NEW.post_id IS NOT NULL THEN
        SELECT COUNT(*) INTO report_count
        FROM public.community_reports
        WHERE post_id = NEW.post_id
          AND resolved = false
          AND created_at > now() - interval '24 hours';

        IF report_count >= 10 THEN
            UPDATE public.community_posts SET hidden = true WHERE id = NEW.post_id;
        END IF;
    END IF;

    IF NEW.comment_id IS NOT NULL THEN
        SELECT COUNT(*) INTO report_count
        FROM public.community_reports
        WHERE comment_id = NEW.comment_id
          AND resolved = false
          AND created_at > now() - interval '24 hours';

        IF report_count >= 10 THEN
            UPDATE public.community_comments SET hidden = true WHERE id = NEW.comment_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
;

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

CREATE OR REPLACE FUNCTION public.get_random_levels(row_count integer, filter_type text)
 RETURNS SETOF public.levels
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT *
    FROM levels
    WHERE
        (
            filter_type IS NULL
        )
        OR
        (
            filter_type = 'fl'
            AND "flTop" IS NOT NULL
        )
        OR
        (
            filter_type = 'dl'
            AND "dlTop" IS NOT NULL
            AND "isPlatformer" = false
        )
        OR
        (
            filter_type = 'pl'
            AND "dlTop" IS NOT NULL
            AND "isPlatformer" = true
        )
    ORDER BY RANDOM()
    LIMIT row_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_top_buyers(interval_ms bigint, limit_count integer, offset_count integer)
 RETURNS TABLE(uid uuid, "totalAmount" double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$BEGIN
  RETURN QUERY
  SELECT 
    p.uid,
    SUM(o.amount) AS "totalAmount"
  FROM orders o
  JOIN players p ON p.uid = o."userID"
  WHERE o.created_at >= NOW() - (interval '1 millisecond' * interval_ms)
    AND p.uid != '3e788ac1-989c-4d2b-bfaf-f99059d258cf'
    AND o.delivered = true
    AND o.amount > 0
  GROUP BY p.uid
  ORDER BY "totalAmount" DESC
  LIMIT limit_count
  OFFSET offset_count;
END;$function$
;

CREATE OR REPLACE FUNCTION public.record_community_post_view(p_user_id uuid, p_post_id integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.community_post_views (uid, post_id, view_count, last_viewed_at)
    VALUES (p_user_id, p_post_id, 1, now())
    ON CONFLICT (uid, post_id)
    DO UPDATE SET
        view_count = community_post_views.view_count + 1,
        last_viewed_at = now();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_wiki_tree()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public."wikiTree";
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_community_comments_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    if tg_op = 'INSERT' then
        update public.community_posts set comments_count = comments_count + 1 where id = new.post_id;
        return new;
    elsif tg_op = 'DELETE' then
        update public.community_posts set comments_count = comments_count - 1 where id = old.post_id;
        return old;
    end if;
    return null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_community_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    if tg_op = 'INSERT' then
        if new.post_id is not null then
            update public.community_posts set likes_count = likes_count + 1 where id = new.post_id;
        end if;
        if new.comment_id is not null then
            update public.community_comments set likes_count = likes_count + 1 where id = new.comment_id;
        end if;
        return new;
    elsif tg_op = 'DELETE' then
        if old.post_id is not null then
            update public.community_posts set likes_count = likes_count - 1 where id = old.post_id;
        end if;
        if old.comment_id is not null then
            update public.community_comments set likes_count = likes_count - 1 where id = old.comment_id;
        end if;
        return old;
    end if;
    return null;
end;
$function$
;

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

CREATE OR REPLACE FUNCTION public.update_community_post_views_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts
        SET views_count = views_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
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

CREATE OR REPLACE FUNCTION public.update_rank()
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
      and levels."isChallenge" = false
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
            else null
          end desc nulls last,
          levels.name
      ) as no
    from
      records,
      levels
    where
      levels.id = records.levelid
      and levels."isChallenge" = true
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
      and levels."isChallenge" = false
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
      and levels."isChallenge" = false
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
            when p."supporterUntil" is null then r.timestamp - r."prioritizedBy"
            when p."supporterUntil" > NOW() then (r.timestamp - 2592000000)::int8 - r."prioritizedBy"
            else r.timestamp - r."prioritizedBy"
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

update public.records r
set
  "plPt" = sub."plPt"
from
  (
    select
      r.userid,
      r.levelid,
      case
        when r.progress <= 0
        or l."minProgress" is null
        or l."minProgress" <= 0 then 0
        else GREATEST(
          0.3 * COALESCE(l.rating, 0),
          COALESCE(l.rating, 0) * POWER(
            l."minProgress"::double precision / r.progress,
            0.5849625
          )
        )
      end as "plPt"
    from
      public.records r
      join public.levels l on l.id = r.levelid
    where
      r."isChecked" = true
      and l."isPlatformer" = true
      and l."isChallenge" = false
  ) as sub
where
  r.userid = sub.userid
  and r.levelid = sub.levelid;

update public.records r
set
  "clPt" = sub."clPt"
from
  (
    select
      r.userid,
      r.levelid,
      case
        when r.progress < 100 or r.no > 75 then 0
        else (l.rating * greatest(0, ceil(- power((no - 42.21) / 10, 3) + 30) / 100)) / 12
        end as "clPt"
    from
      public.records r
      join public.levels l on l.id = r.levelid
    where
      r."isChecked" = true
      and l."isChallenge" = true
  ) as sub
where
  r.userid = sub.userid
  and r.levelid = sub.levelid;

with
  ranked_plays as (
    select
      r.userid,
      r.levelid,
      r."plPt",
      ROW_NUMBER() over (
        partition by
          r.userid
        order by
          r."plPt" desc
      ) as rn
    from
      public.records r
      join public.levels l on l.id = r.levelid
    where
      r."isChecked" = true
      and l."isPlatformer" = true
      and l."isChallenge" = false
  ),
  weighted as (
    select
      userid,
      "plPt",
      rn,
      case
        when rn = 1 then 0.5
        when rn = 2 then 0.3
        when rn = 3 then 0.15
        else GREATEST(0.01, 0.05 / POWER(rn - 3, 0.5))
      end as weight
    from
      ranked_plays
  ),
  sum_weighted as (
    select
      userid,
      SUM("plPt" * weight) as total_rating
    from
      weighted
    group by
      userid
  )
update public.players p
set
  "plRating" = case
    when sw.total_rating = 0 then null
    else sw.total_rating
  end
from
  sum_weighted sw
where
  p.uid = sw.userid;

with
  ranked_players as (
    select
      uid,
      RANK() over (
        order by
          "plRating" desc nulls last
      ) as rnk
    from
      public.players
  )
update public.players p
set
  "plrank" = rp.rnk
from
  ranked_players rp
where
  p.uid = rp.uid;

with
  ranked_plays as (
    select
      r.userid,
      r.levelid,
      r."clPt",
      ROW_NUMBER() over (
        partition by
          r.userid
        order by
          r."clPt" desc
      ) as rn
    from
      public.records r
      join public.levels l on l.id = r.levelid
    where
      r."isChecked" = true
      and l."isChallenge" = true
  ),
  sum_weighted as (
    select
      userid,
      SUM("clPt") as total_rating
    from
      ranked_plays
    group by
      userid
  )
update public.players p
set
  "clRating" = case
    when sw.total_rating = 0 then null
    else sw.total_rating
  end
from
  sum_weighted sw
where
  p.uid = sw.userid;

with
  ranked_players as (
    select
      uid,
      RANK() over (
        order by
          "clRating" desc nulls last
      ) as rnk
    from
      public.players
  )
update public.players p
set
  "clrank" = rp.rnk
from
  ranked_players rp
where
  p.uid = rp.uid;
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

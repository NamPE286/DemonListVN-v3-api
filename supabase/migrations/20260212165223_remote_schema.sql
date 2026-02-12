


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_event_levels_progress"("updates" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."add_event_levels_progress"("updates" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_hide_reported_content"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."auto_hide_reported_content"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_hide_reported_posts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF (SELECT count(*) FROM public.community_reports WHERE post_id = NEW.post_id AND resolved = false) >= 5 THEN
        UPDATE public.community_posts_admin SET hidden = true WHERE post_id = NEW.post_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_hide_reported_posts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event_leaderboard"("event_id" integer) RETURNS TABLE("userID" "uuid", "elo" bigint, "matchCount" bigint, "point" numeric, "penalty" numeric)
    LANGUAGE "plpgsql"
    AS $$BEGIN
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
END;$$;


ALTER FUNCTION "public"."get_event_leaderboard"("event_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_queue_no"("userid" "uuid", "levelid" bigint, "p" bigint) RETURNS bigint
    LANGUAGE "plpgsql"
    AS $$DECLARE
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
END;$$;


ALTER FUNCTION "public"."get_queue_no"("userid" "uuid", "levelid" bigint, "p" bigint) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."levels" (
    "id" bigint NOT NULL,
    "name" character varying DEFAULT 'N/a'::character varying,
    "creator" "text",
    "videoID" character varying DEFAULT 'N/a'::character varying,
    "minProgress" bigint DEFAULT '100'::bigint,
    "flTop" double precision,
    "dlTop" double precision,
    "flPt" double precision,
    "rating" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "isPlatformer" boolean DEFAULT false NOT NULL,
    "insaneTier" bigint,
    "accepted" boolean DEFAULT false NOT NULL,
    "isNonList" boolean DEFAULT false NOT NULL,
    "difficulty" "text",
    "isChallenge" boolean DEFAULT false NOT NULL,
    "creatorId" "uuid",
    "main_level_id" bigint
);


ALTER TABLE "public"."levels" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_random_levels"("row_count" integer, "filter_type" "text") RETURNS SETOF "public"."levels"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_random_levels"("row_count" integer, "filter_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recommended_community_posts"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 25, "p_offset" integer DEFAULT 0, "p_type" "text" DEFAULT NULL::"text") RETURNS TABLE("id" integer, "uid" "uuid", "title" "text", "content" "text", "type" "text", "image_url" "text", "video_url" "text", "attached_record" "jsonb", "attached_level" "jsonb", "pinned" boolean, "likes_count" integer, "comments_count" integer, "views_count" integer, "is_recommended" boolean, "hidden" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "recommendation_score" double precision)
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_preferred_types text[];
BEGIN
    -- Get user's preferred post types (types they've liked most)
    IF p_user_id IS NOT NULL THEN
        SELECT ARRAY_AGG(preferred_type)
        INTO v_preferred_types
        FROM (
            SELECT cp.type AS preferred_type
            FROM public.community_likes cl
            JOIN public.community_posts cp ON cp.id = cl.post_id
            JOIN public.community_posts_admin cpa ON cpa.post_id = cp.id
            WHERE cl.uid = p_user_id
              AND cl.post_id IS NOT NULL
              AND cpa.hidden = false
              AND cpa.moderation_status = 'approved'
            GROUP BY cp.type
            ORDER BY COUNT(*) DESC
            LIMIT 3
        ) sub;
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.uid,
        p.title,
        p.content,
        p.type,
        p.image_url,
        p.video_url,
        p.attached_record,
        p.attached_level,
        p.pinned,
        p.likes_count,
        p.comments_count,
        p.views_count,
        p.is_recommended,
        pa.hidden,
        p.created_at,
        p.updated_at,
        (
            -- Engagement score
            (p.likes_count * 2.0 + p.comments_count * 3.0 + COALESCE(p.views_count, 0) * 0.1 + 1.0)
            -- Recency multiplier (decays over days)
            * (1.0 / POWER(EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0 + 1.0, 0.8))
            -- Preference boost for user's preferred types
            * CASE
                WHEN p_user_id IS NOT NULL AND v_preferred_types IS NOT NULL AND p.type = ANY(v_preferred_types) THEN 1.5
                ELSE 1.0
              END
            -- Penalty for posts user has already viewed many times
            * CASE
                WHEN p_user_id IS NOT NULL THEN
                    COALESCE(
                        1.0 / (1.0 + (SELECT pv.view_count FROM public.community_post_views pv WHERE pv.uid = p_user_id AND pv.post_id = p.id)),
                        1.0
                    )
                ELSE 1.0
              END
            -- Pinned posts get a bonus
            * CASE WHEN p.pinned THEN 2.0 ELSE 1.0 END
        )::double precision AS recommendation_score
    FROM public.community_posts p
    JOIN public.community_posts_admin pa ON pa.post_id = p.id
    WHERE pa.hidden = false
      AND pa.moderation_status = 'approved'
      AND (p_type IS NULL OR p.type = p_type)
    ORDER BY recommendation_score DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_recommended_community_posts"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer, "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_buyers"("interval_ms" bigint, "limit_count" integer, "offset_count" integer) RETURNS TABLE("uid" "uuid", "totalAmount" double precision)
    LANGUAGE "plpgsql" STABLE
    AS $$BEGIN
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
END;$$;


ALTER FUNCTION "public"."get_top_buyers"("interval_ms" bigint, "limit_count" integer, "offset_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_community_post_view"("p_user_id" "uuid", "p_post_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.community_post_views (uid, post_id, view_count, last_viewed_at)
    VALUES (p_user_id, p_post_id, 1, now())
    ON CONFLICT (uid, post_id)
    DO UPDATE SET
        view_count = community_post_views.view_count + 1,
        last_viewed_at = now();
END;
$$;


ALTER FUNCTION "public"."record_community_post_view"("p_user_id" "uuid", "p_post_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_wiki_tree"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public."wikiTree";
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."refresh_wiki_tree"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_community_comment_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if (TG_OP = 'INSERT') then
        update public.community_posts set comments_count = comments_count + 1 where id = new.post_id;
    elsif (TG_OP = 'DELETE') then
        update public.community_posts set comments_count = comments_count - 1 where id = old.post_id;
    end if;
    return null;
end;
$$;


ALTER FUNCTION "public"."update_community_comment_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_community_comments_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_community_comments_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_community_like_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if (TG_OP = 'INSERT') then
        if new.post_id is not null then
            update public.community_posts set likes_count = likes_count + 1 where id = new.post_id;
        end if;
        if new.comment_id is not null then
            update public.community_comments set likes_count = likes_count + 1 where id = new.comment_id;
        end if;
    elsif (TG_OP = 'DELETE') then
        if old.post_id is not null then
            update public.community_posts set likes_count = likes_count - 1 where id = old.post_id;
        end if;
        if old.comment_id is not null then
            update public.community_comments set likes_count = likes_count - 1 where id = old.comment_id;
        end if;
    end if;
    return null;
end;
$$;


ALTER FUNCTION "public"."update_community_like_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_community_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_community_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_community_post_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_community_post_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_community_post_views_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts
        SET views_count = views_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_community_post_views_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_list"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$begin
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
end$$;


ALTER FUNCTION "public"."update_list"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_rank"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$begin

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
end$$;


ALTER FUNCTION "public"."update_rank"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_supporter_until"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_supporter_until"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."APIKey" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "key" "text" DEFAULT "md5"(("random"())::"text") NOT NULL,
    "uid" "uuid" NOT NULL
);


ALTER TABLE "public"."APIKey" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PVPPlayers" (
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "player" "uuid" NOT NULL,
    "room" bigint NOT NULL
);


ALTER TABLE "public"."PVPPlayers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PVPRooms" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "playerCount" bigint DEFAULT '0'::bigint NOT NULL,
    "averageRating" bigint DEFAULT '0'::bigint NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "host" "uuid"
);


ALTER TABLE "public"."PVPRooms" OWNER TO "postgres";


ALTER TABLE "public"."PVPRooms" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."PVPRoom_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" bigint NOT NULL,
    "name" character varying DEFAULT 'defaultname'::character varying NOT NULL,
    "redirect" "text",
    "type" "text" DEFAULT 'medal'::"text" NOT NULL,
    "description" "text",
    "productId" bigint,
    "rarity" bigint DEFAULT '0'::bigint NOT NULL,
    "quantity" bigint DEFAULT '1'::bigint NOT NULL,
    "stackable" boolean DEFAULT false NOT NULL,
    "defaultExpireAfter" bigint,
    CONSTRAINT "items_rarity_check" CHECK (((0 <= "rarity") AND ("rarity" <= 4)))
);


ALTER TABLE "public"."items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."items"."rarity" IS '0: common (gray), 1: uncommon (blue), 2: rare (purple), 3: epic (pink), 4: covert (red)';



ALTER TABLE "public"."items" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."achievement_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."battlePassLevelProgress" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "battlePassLevelId" bigint NOT NULL,
    "userID" "uuid" NOT NULL,
    "progress" bigint DEFAULT '0'::bigint NOT NULL,
    "minProgressClaimed" boolean DEFAULT false NOT NULL,
    "completionClaimed" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."battlePassLevelProgress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."battlePassLevels" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "seasonId" bigint NOT NULL,
    "levelID" bigint NOT NULL,
    "xp" bigint DEFAULT '0'::bigint NOT NULL,
    "minProgressXp" bigint DEFAULT '0'::bigint NOT NULL,
    "minProgress" bigint DEFAULT '100'::bigint NOT NULL,
    "type" "text" DEFAULT 'normal'::"text" NOT NULL,
    CONSTRAINT "battlePassLevels_type_check" CHECK (("type" = ANY (ARRAY['normal'::"text", 'daily'::"text", 'weekly'::"text"])))
);


ALTER TABLE "public"."battlePassLevels" OWNER TO "postgres";


ALTER TABLE "public"."battlePassLevels" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."battlePassLevels_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."battlePassMapPackLevelProgress" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "battlePassMapPackId" bigint NOT NULL,
    "levelID" bigint NOT NULL,
    "userID" "uuid" NOT NULL,
    "progress" bigint DEFAULT '0'::bigint NOT NULL
);


ALTER TABLE "public"."battlePassMapPackLevelProgress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."battlePassMapPackProgress" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "battlePassMapPackId" bigint NOT NULL,
    "userID" "uuid" NOT NULL,
    "claimed" boolean DEFAULT false NOT NULL,
    "progress" bigint DEFAULT '0'::bigint NOT NULL
);


ALTER TABLE "public"."battlePassMapPackProgress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."battlePassMapPacks" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "seasonId" bigint NOT NULL,
    "mapPackId" bigint NOT NULL,
    "unlockWeek" bigint NOT NULL,
    "order" bigint DEFAULT '0'::bigint NOT NULL
);


ALTER TABLE "public"."battlePassMapPacks" OWNER TO "postgres";


ALTER TABLE "public"."battlePassMapPacks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."battlePassMapPacks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."battlePassMissionClaims" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "missionId" bigint NOT NULL,
    "userID" "uuid" NOT NULL
);


ALTER TABLE "public"."battlePassMissionClaims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."battlePassMissionProgress" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "missionId" bigint NOT NULL,
    "userID" "uuid" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."battlePassMissionProgress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."battlePassMissionRewards" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "missionId" bigint NOT NULL,
    "itemId" bigint NOT NULL,
    "quantity" bigint DEFAULT '1'::bigint NOT NULL,
    "expireAfter" bigint
);


ALTER TABLE "public"."battlePassMissionRewards" OWNER TO "postgres";


ALTER TABLE "public"."battlePassMissionRewards" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."battlePassMissionRewards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."battlePassMissions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "seasonId" bigint NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "condition" "jsonb" NOT NULL,
    "xp" bigint NOT NULL,
    "order" bigint DEFAULT '0'::bigint NOT NULL,
    "refreshType" "text" DEFAULT 'none'::"text" NOT NULL
);


ALTER TABLE "public"."battlePassMissions" OWNER TO "postgres";


ALTER TABLE "public"."battlePassMissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."battlePassMissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."battlePassProgress" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "seasonId" bigint NOT NULL,
    "userID" "uuid" NOT NULL,
    "xp" bigint DEFAULT '0'::bigint NOT NULL
);


ALTER TABLE "public"."battlePassProgress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."battlePassRewardClaims" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "rewardId" bigint NOT NULL,
    "userID" "uuid" NOT NULL
);


ALTER TABLE "public"."battlePassRewardClaims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."battlePassSeasons" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start" timestamp with time zone NOT NULL,
    "end" timestamp with time zone NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "primaryColor" "text"
);


ALTER TABLE "public"."battlePassSeasons" OWNER TO "postgres";


ALTER TABLE "public"."battlePassSeasons" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."battlePassSeasons_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."battlePassTierRewards" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "seasonId" bigint NOT NULL,
    "tier" bigint NOT NULL,
    "isPremium" boolean DEFAULT false NOT NULL,
    "itemId" bigint NOT NULL,
    "quantity" bigint DEFAULT '1'::bigint NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."battlePassTierRewards" OWNER TO "postgres";


ALTER TABLE "public"."battlePassTierRewards" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."battlePassTierRewards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."battlePassXPLogs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "userID" "uuid" NOT NULL,
    "seasonId" bigint NOT NULL,
    "amount" bigint NOT NULL,
    "source" "text" NOT NULL,
    "refId" bigint,
    "description" "text"
);


ALTER TABLE "public"."battlePassXPLogs" OWNER TO "postgres";


ALTER TABLE "public"."battlePassXPLogs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."battlePassXPLogs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "supporterIncluded" bigint DEFAULT '0'::bigint NOT NULL,
    "owner" "uuid",
    "activationDate" timestamp with time zone,
    "name" "text" DEFAULT 'Basic Card'::"text" NOT NULL,
    "img" "text" DEFAULT 'https://qdwpenfblwdmhywwszzj.supabase.co/storage/v1/object/public/cards/basic.webp'::"text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."cards" OWNER TO "postgres";


COMMENT ON COLUMN "public"."cards"."supporterIncluded" IS 'Day of supporter included';



CREATE TABLE IF NOT EXISTS "public"."caseItems" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "itemId" bigint NOT NULL,
    "rate" double precision,
    "caseId" bigint NOT NULL,
    "id" bigint NOT NULL,
    "expireAfter" bigint DEFAULT '604800000'::bigint
);


ALTER TABLE "public"."caseItems" OWNER TO "postgres";


COMMENT ON COLUMN "public"."caseItems"."expireAfter" IS 'ms';



ALTER TABLE "public"."caseItems" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."caseItems_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."caseResult" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resultId" bigint,
    "openerId" "uuid" NOT NULL,
    "caseId" bigint NOT NULL
);


ALTER TABLE "public"."caseResult" OWNER TO "postgres";


ALTER TABLE "public"."caseResult" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."caseResult_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."changelogs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "levelID" bigint NOT NULL,
    "old" json,
    "new" json NOT NULL,
    "published" boolean DEFAULT false
);


ALTER TABLE "public"."changelogs" OWNER TO "postgres";


ALTER TABLE "public"."changelogs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."changelogs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."clanBan" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "userid" "uuid" NOT NULL,
    "clan" bigint NOT NULL
);


ALTER TABLE "public"."clanBan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clanInvitations" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "to" "uuid" NOT NULL,
    "clan" bigint NOT NULL
);


ALTER TABLE "public"."clanInvitations" OWNER TO "postgres";


ALTER TABLE "public"."clanInvitations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."clanInvitations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."clans" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "tag" "text" NOT NULL,
    "owner" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "tagTextColor" "text",
    "tagBgColor" "text",
    "memberCount" bigint DEFAULT '1'::bigint NOT NULL,
    "rating" bigint DEFAULT '0'::bigint NOT NULL,
    "rank" bigint,
    "memberLimit" bigint DEFAULT '50'::bigint NOT NULL,
    "imageVersion" bigint DEFAULT '0'::bigint NOT NULL,
    "boostedUntil" timestamp with time zone DEFAULT "now"() NOT NULL,
    "homeContent" "text",
    "mode" "text" DEFAULT 'markdown'::"text" NOT NULL,
    CONSTRAINT "clans_memberLimit_check" CHECK (("memberLimit" <= 500)),
    CONSTRAINT "clans_mode_check" CHECK (("mode" = ANY (ARRAY['markdown'::"text", 'iframe'::"text"]))),
    CONSTRAINT "clans_name_check" CHECK (("length"("name") <= 30)),
    CONSTRAINT "clans_tag_check" CHECK ((("length"("tag") <= 6) AND ("length"("tag") >= 2)))
);


ALTER TABLE "public"."clans" OWNER TO "postgres";


ALTER TABLE "public"."clans" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."clans_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."community_comments" (
    "id" integer NOT NULL,
    "post_id" integer NOT NULL,
    "uid" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "likes_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hidden" boolean DEFAULT false NOT NULL,
    "attached_level" "jsonb"
);


ALTER TABLE "public"."community_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_comments_admin" (
    "comment_id" integer NOT NULL,
    "moderation_status" "text" DEFAULT 'approved'::"text" NOT NULL,
    "moderation_result" "jsonb",
    "hidden" boolean DEFAULT false NOT NULL,
    CONSTRAINT "community_comments_admin_moderation_status_check" CHECK (("moderation_status" = ANY (ARRAY['approved'::"text", 'pending'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."community_comments_admin" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."community_comments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."community_comments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."community_comments_id_seq" OWNED BY "public"."community_comments"."id";



CREATE TABLE IF NOT EXISTS "public"."community_likes" (
    "id" integer NOT NULL,
    "uid" "uuid" NOT NULL,
    "post_id" integer,
    "comment_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "community_likes_target_check" CHECK (((("post_id" IS NOT NULL) AND ("comment_id" IS NULL)) OR (("post_id" IS NULL) AND ("comment_id" IS NOT NULL))))
);


ALTER TABLE "public"."community_likes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."community_likes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."community_likes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."community_likes_id_seq" OWNED BY "public"."community_likes"."id";



CREATE TABLE IF NOT EXISTS "public"."community_post_views" (
    "id" integer NOT NULL,
    "uid" "uuid" NOT NULL,
    "post_id" integer NOT NULL,
    "view_count" integer DEFAULT 1 NOT NULL,
    "last_viewed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."community_post_views" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."community_post_views_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."community_post_views_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."community_post_views_id_seq" OWNED BY "public"."community_post_views"."id";



CREATE TABLE IF NOT EXISTS "public"."community_posts" (
    "id" integer NOT NULL,
    "uid" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "type" "text" DEFAULT 'discussion'::"text" NOT NULL,
    "image_url" "text",
    "pinned" boolean DEFAULT false NOT NULL,
    "likes_count" integer DEFAULT 0 NOT NULL,
    "comments_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "video_url" "text",
    "attached_record" "jsonb",
    "attached_level" "jsonb",
    "is_recommended" boolean,
    "fts" "tsvector" GENERATED ALWAYS AS (("setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("title", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("content", ''::"text")), 'B'::"char"))) STORED,
    "views_count" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "community_posts_type_check" CHECK (("type" = ANY (ARRAY['discussion'::"text", 'media'::"text", 'guide'::"text", 'announcement'::"text", 'review'::"text"])))
);


ALTER TABLE "public"."community_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_posts_admin" (
    "post_id" integer NOT NULL,
    "moderation_status" "text" DEFAULT 'approved'::"text" NOT NULL,
    "moderation_result" "jsonb",
    "hidden" boolean DEFAULT false NOT NULL,
    CONSTRAINT "community_posts_admin_moderation_status_check" CHECK (("moderation_status" = ANY (ARRAY['approved'::"text", 'pending'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."community_posts_admin" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."community_posts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."community_posts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."community_posts_id_seq" OWNED BY "public"."community_posts"."id";



CREATE TABLE IF NOT EXISTS "public"."community_posts_tags" (
    "post_id" integer NOT NULL,
    "tag_id" integer NOT NULL
);


ALTER TABLE "public"."community_posts_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_reports" (
    "id" integer NOT NULL,
    "uid" "uuid" NOT NULL,
    "post_id" integer,
    "comment_id" integer,
    "reason" "text" DEFAULT 'inappropriate'::"text" NOT NULL,
    "description" "text",
    "resolved" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "community_reports_reason_check" CHECK (("reason" = ANY (ARRAY['inappropriate'::"text", 'spam'::"text", 'harassment'::"text", 'misinformation'::"text", 'other'::"text"]))),
    CONSTRAINT "community_reports_target_check" CHECK (((("post_id" IS NOT NULL) AND ("comment_id" IS NULL)) OR (("post_id" IS NULL) AND ("comment_id" IS NOT NULL))))
);


ALTER TABLE "public"."community_reports" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."community_reports_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."community_reports_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."community_reports_id_seq" OWNED BY "public"."community_reports"."id";



CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "code" "text" DEFAULT "md5"(("random"())::"text") NOT NULL,
    "percent" double precision DEFAULT '0'::double precision NOT NULL,
    "deduct" bigint DEFAULT '0'::bigint NOT NULL,
    "usageLeft" bigint DEFAULT '1'::bigint NOT NULL,
    "validUntil" timestamp with time zone NOT NULL,
    "quantity" bigint DEFAULT '1'::bigint NOT NULL,
    "productID" bigint,
    "owner" "uuid",
    CONSTRAINT "coupons_percent_check" CHECK (("percent" <= (1)::double precision))
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deathCount" (
    "levelID" bigint NOT NULL,
    "count" bigint[] NOT NULL,
    "uid" "uuid" NOT NULL,
    "completedTime" timestamp with time zone,
    "tag" "text" DEFAULT 'default'::"text" NOT NULL,
    CONSTRAINT "deathCount_count_check" CHECK (("cardinality"("count") = 100))
);


ALTER TABLE "public"."deathCount" OWNER TO "postgres";


ALTER TABLE "public"."deathCount" ALTER COLUMN "levelID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deathCount_levelID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."eventLevelUnlockConditions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "eventLevelId" bigint,
    "requireEventLevelId" bigint
);


ALTER TABLE "public"."eventLevelUnlockConditions" OWNER TO "postgres";


ALTER TABLE "public"."eventLevelUnlockConditions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."eventLevelUnlockConditions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."eventLevels" (
    "eventID" bigint NOT NULL,
    "levelID" bigint NOT NULL,
    "point" bigint NOT NULL,
    "needRaw" boolean DEFAULT false NOT NULL,
    "id" bigint NOT NULL,
    "totalProgress" double precision DEFAULT '0'::double precision NOT NULL,
    "requiredLevel" bigint,
    "minEventProgress" double precision DEFAULT '0'::double precision NOT NULL,
    "unlockCondition" "jsonb"
);


ALTER TABLE "public"."eventLevels" OWNER TO "postgres";


COMMENT ON COLUMN "public"."eventLevels"."requiredLevel" IS 'deprecated';



ALTER TABLE "public"."eventLevels" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."eventLevels_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."eventProofs" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "userid" "uuid" NOT NULL,
    "eventID" bigint NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "accepted" boolean DEFAULT false NOT NULL,
    "data" "jsonb",
    "diff" bigint
);


ALTER TABLE "public"."eventProofs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."eventQuestClaims" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "userId" "uuid" NOT NULL,
    "questId" bigint NOT NULL
);


ALTER TABLE "public"."eventQuestClaims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."eventQuestRewards" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "questId" bigint,
    "rewardId" bigint,
    "expireAfter" bigint
);


ALTER TABLE "public"."eventQuestRewards" OWNER TO "postgres";


ALTER TABLE "public"."eventQuestRewards" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."eventQuestRewards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."eventQuests" (
    "id" bigint NOT NULL,
    "eventId" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "condition" "jsonb" NOT NULL
);


ALTER TABLE "public"."eventQuests" OWNER TO "postgres";


ALTER TABLE "public"."eventQuests" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."eventQuests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."eventRecords" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "userID" "uuid" NOT NULL,
    "levelID" bigint NOT NULL,
    "progress" double precision NOT NULL,
    "accepted" boolean,
    "videoLink" "text" NOT NULL,
    "raw" "text",
    "rejectReason" "text"
);


ALTER TABLE "public"."eventRecords" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "start" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end" timestamp with time zone,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "imgUrl" "text",
    "exp" bigint,
    "content" "text",
    "redirect" "text",
    "minExp" bigint DEFAULT '0'::bigint NOT NULL,
    "needProof" boolean DEFAULT true NOT NULL,
    "isSupporterOnly" boolean DEFAULT false NOT NULL,
    "isContest" boolean DEFAULT false NOT NULL,
    "hidden" boolean DEFAULT false NOT NULL,
    "freeze" timestamp with time zone,
    "isExternal" boolean DEFAULT false NOT NULL,
    "data" "jsonb",
    "isRanked" boolean DEFAULT false NOT NULL,
    "isCalculated" boolean DEFAULT false NOT NULL,
    "priority" bigint DEFAULT '0'::bigint NOT NULL,
    "type" "text" DEFAULT 'basic'::"text" NOT NULL,
    CONSTRAINT "events_type_check" CHECK (("type" = ANY (ARRAY['basic'::"text", 'contest'::"text", 'raid'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."heatmap" (
    "uid" "uuid" NOT NULL,
    "year" bigint NOT NULL,
    "days" bigint[] NOT NULL,
    CONSTRAINT "attempts_days_check" CHECK (("cardinality"("days") = 366))
);


ALTER TABLE "public"."heatmap" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "userID" "uuid" NOT NULL,
    "itemId" bigint NOT NULL,
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" bigint NOT NULL,
    "consumed" boolean DEFAULT false NOT NULL,
    "expireAt" timestamp with time zone,
    "redirectTo" "text",
    "quantity" bigint DEFAULT '1'::bigint NOT NULL,
    CONSTRAINT "inventory_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


ALTER TABLE "public"."inventory" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."inventory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."itemTransactions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inventoryItemId" bigint NOT NULL,
    "diff" bigint NOT NULL,
    "data" "jsonb"
);


ALTER TABLE "public"."itemTransactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."levelDeathCount" (
    "levelID" bigint NOT NULL,
    "count" bigint[] NOT NULL,
    CONSTRAINT "deathCount_count_check" CHECK (("cardinality"("count") = 100))
);


ALTER TABLE "public"."levelDeathCount" OWNER TO "postgres";


ALTER TABLE "public"."levelDeathCount" ALTER COLUMN "levelID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."levelDeathCount_levelID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."levelGDStates" (
    "levelId" bigint NOT NULL,
    "isDaily" boolean DEFAULT false,
    "isWeekly" boolean DEFAULT false
);


ALTER TABLE "public"."levelGDStates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."levelSubmissions" (
    "userId" "uuid" NOT NULL,
    "levelId" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted" boolean DEFAULT false NOT NULL,
    "comment" "text"
);


ALTER TABLE "public"."levelSubmissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."level_tags" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#6b7280'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."level_tags" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."level_tags_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."level_tags_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."level_tags_id_seq" OWNED BY "public"."level_tags"."id";



CREATE TABLE IF NOT EXISTS "public"."levels_tags" (
    "level_id" bigint NOT NULL,
    "tag_id" integer NOT NULL
);


ALTER TABLE "public"."levels_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mapPackLevels" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mapPackId" bigint NOT NULL,
    "levelID" bigint NOT NULL,
    "order" bigint DEFAULT '0'::bigint NOT NULL
);


ALTER TABLE "public"."mapPackLevels" OWNER TO "postgres";


ALTER TABLE "public"."mapPackLevels" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."mapPackLevels_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."mapPacks" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "difficulty" "text" NOT NULL,
    "xp" bigint NOT NULL,
    CONSTRAINT "mapPacks_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['easier'::"text", 'harder'::"text", 'medium_demon'::"text", 'insane_demon'::"text"])))
);


ALTER TABLE "public"."mapPacks" OWNER TO "postgres";


ALTER TABLE "public"."mapPacks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."mapPacks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "content" "text",
    "to" "uuid" NOT NULL,
    "status" bigint DEFAULT '0'::bigint NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "redirect" "text"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


ALTER TABLE "public"."notifications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."orderItems" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "productID" bigint NOT NULL,
    "orderID" bigint NOT NULL,
    "quantity" bigint DEFAULT '1'::bigint NOT NULL,
    CONSTRAINT "orderItems_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."orderItems" OWNER TO "postgres";


ALTER TABLE "public"."orderItems" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orderItems_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."orderTracking" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "orderID" bigint NOT NULL,
    "id" bigint NOT NULL,
    "content" "text",
    "link" "text",
    "delivering" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."orderTracking" OWNER TO "postgres";


ALTER TABLE "public"."orderTracking" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orderTracking_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "userID" "uuid" NOT NULL,
    "state" "text" NOT NULL,
    "quantity" bigint,
    "productID" bigint,
    "delivered" boolean DEFAULT false NOT NULL,
    "giftTo" "uuid",
    "discount" double precision DEFAULT '0'::double precision NOT NULL,
    "coupon" "text",
    "amount" double precision NOT NULL,
    "currency" "text" DEFAULT ''::"text" NOT NULL,
    "paymentMethod" "text" DEFAULT 'Bank Transfer'::"text" NOT NULL,
    "address" "text",
    "phone" bigint,
    "fee" bigint DEFAULT '0'::bigint NOT NULL,
    "recipientName" "text",
    "targetClanID" bigint,
    "data" "jsonb",
    CONSTRAINT "orders_discount_check" CHECK (("discount" <= (1)::double precision))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orders"."quantity" IS 'Set NULL for physical product';



COMMENT ON COLUMN "public"."orders"."productID" IS 'Set NULL for physical product';



ALTER TABLE "public"."orders" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."otp" (
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expired_at" timestamp with time zone NOT NULL,
    "granted_by" "uuid",
    "is_expired" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."otp" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playerSubscriptions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "userID" "uuid" NOT NULL,
    "subscriptionId" bigint NOT NULL,
    "start" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end" timestamp with time zone
);


ALTER TABLE "public"."playerSubscriptions" OWNER TO "postgres";


ALTER TABLE "public"."playerSubscriptions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."playerSubscriptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" bigint NOT NULL,
    "name" "text",
    "email" "text",
    "facebook" "text",
    "youtube" "text",
    "discord" "text",
    "totalFLpt" double precision,
    "totalDLpt" double precision,
    "flrank" bigint,
    "dlrank" bigint,
    "uid" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "isBanned" boolean DEFAULT false NOT NULL,
    "isHidden" boolean DEFAULT false NOT NULL,
    "rating" double precision DEFAULT '0'::double precision,
    "dlMaxPt" bigint,
    "flMaxPt" bigint,
    "overallRank" bigint,
    "province" "text",
    "city" "text",
    "isTrusted" boolean DEFAULT false NOT NULL,
    "reviewCooldown" timestamp with time zone,
    "renameCooldown" timestamp with time zone DEFAULT '2020-06-09 14:03:33.297+00'::timestamp with time zone NOT NULL,
    "clan" bigint,
    "recordCount" bigint DEFAULT '0'::bigint NOT NULL,
    "exp" bigint DEFAULT '0'::bigint NOT NULL,
    "extraExp" bigint,
    "supporterUntil" timestamp with time zone,
    "isAvatarGif" boolean DEFAULT false NOT NULL,
    "isBannerGif" boolean DEFAULT false NOT NULL,
    "bgColor" "text",
    "borderColor" "text",
    "DiscordDMChannelID" "text",
    "avatarVersion" bigint DEFAULT '0'::bigint NOT NULL,
    "bannerVersion" bigint DEFAULT '0'::bigint NOT NULL,
    "plRating" bigint,
    "plrank" bigint,
    "nameLocked" boolean DEFAULT false NOT NULL,
    "elo" bigint DEFAULT '1500'::bigint NOT NULL,
    "matchCount" bigint DEFAULT '0'::bigint NOT NULL,
    "pointercrate" "text",
    "overviewData" "jsonb",
    "clRating" bigint,
    "clrank" bigint,
    CONSTRAINT "players_name_check" CHECK (("length"("name") <= 20))
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."playersAchievement" (
    "id" bigint NOT NULL,
    "userid" "uuid" NOT NULL,
    "achievementid" bigint NOT NULL,
    "timestamp" bigint
);


ALTER TABLE "public"."playersAchievement" OWNER TO "postgres";


ALTER TABLE "public"."playersAchievement" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."playersAchievement_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."players" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."players_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."post_tags" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#6b7280'::"text" NOT NULL,
    "admin_only" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_tags" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."post_tags_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."post_tags_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."post_tags_id_seq" OWNED BY "public"."post_tags"."id";



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "price" bigint NOT NULL,
    "redirect" "text",
    "description" "text",
    "featured" boolean DEFAULT false NOT NULL,
    "stock" bigint,
    "imgCount" bigint,
    "maxQuantity" bigint,
    "bannerTextColor" "text" DEFAULT '#FFFFFF'::"text" NOT NULL,
    "hidden" boolean DEFAULT false NOT NULL,
    CONSTRAINT "products_stock_check" CHECK (("stock" >= 0))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


ALTER TABLE "public"."products" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."events" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."promotions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."records" (
    "videoLink" character varying,
    "refreshRate" bigint DEFAULT '60'::bigint,
    "progress" bigint DEFAULT '0'::bigint NOT NULL,
    "timestamp" bigint DEFAULT '0'::bigint,
    "flPt" double precision,
    "dlPt" double precision,
    "userid" "uuid" NOT NULL,
    "levelid" bigint NOT NULL,
    "mobile" boolean DEFAULT false NOT NULL,
    "isChecked" boolean DEFAULT false,
    "comment" character varying,
    "suggestedRating" bigint,
    "reviewer" "uuid",
    "needMod" boolean DEFAULT false NOT NULL,
    "reviewerComment" "text",
    "no" bigint,
    "raw" "text" DEFAULT ''::"text",
    "queueNo" bigint,
    "plPt" double precision,
    "prioritizedBy" bigint DEFAULT '0'::bigint NOT NULL,
    "clPt" double precision,
    "variant_id" bigint
);


ALTER TABLE "public"."records" OWNER TO "postgres";


COMMENT ON COLUMN "public"."records"."prioritizedBy" IS 'Prioritize record by some ms';



CREATE TABLE IF NOT EXISTS "public"."rules" (
    "type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "lang" "text" NOT NULL
);


ALTER TABLE "public"."rules" OWNER TO "postgres";


ALTER TABLE "public"."itemTransactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."stackableItemTransactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "price" bigint NOT NULL,
    "refId" bigint
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


ALTER TABLE "public"."subscriptions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."subscriptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."userSocial" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "platform" "text" NOT NULL,
    "id" "text" NOT NULL,
    "userid" "uuid" NOT NULL,
    "isVisible" boolean DEFAULT false NOT NULL,
    "name" "text"
);


ALTER TABLE "public"."userSocial" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki" (
    "path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "locale" "text" DEFAULT 'vi'::"text" NOT NULL,
    "modifiedAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "image" "text"
);


ALTER TABLE "public"."wiki" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."wikiTree" AS
 WITH "exploded" AS (
         SELECT "wiki"."path",
            "wiki"."created_at",
            "string_to_array"("wiki"."path", '/'::"text") AS "parts"
           FROM "public"."wiki"
        ), "levels" AS (
         SELECT "e"."path",
            "e"."created_at",
            "generate_series"(1, "array_length"("e"."parts", 1)) AS "level",
            "e"."parts"
           FROM "exploded" "e"
        ), "nodes" AS (
         SELECT DISTINCT "array_to_string"("levels"."parts"[1:"levels"."level"], '/'::"text") AS "path",
                CASE
                    WHEN ("levels"."level" = "array_length"("levels"."parts", 1)) THEN 'file'::"text"
                    ELSE 'folder'::"text"
                END AS "type",
            "array_to_string"("levels"."parts"[1:("levels"."level" - 1)], '/'::"text") AS "parent",
            "levels"."level"
           FROM "levels"
        ), "node_created_at" AS (
         SELECT "n_1"."path",
            "n_1"."type",
            "min"("w"."created_at") AS "created_at"
           FROM ("nodes" "n_1"
             LEFT JOIN "public"."wiki" "w" ON ((("w"."path" = "n_1"."path") OR ("w"."path" ~~ ("n_1"."path" || '/%'::"text")))))
          GROUP BY "n_1"."path", "n_1"."type"
        )
 SELECT "n"."path",
    "n"."type",
    "n"."parent",
    "n"."level",
        CASE
            WHEN ("n"."type" = 'folder'::"text") THEN "count"("c"."path")
            ELSE NULL::bigint
        END AS "count",
    "nc"."created_at"
   FROM (("nodes" "n"
     LEFT JOIN "nodes" "c" ON ((("c"."parent" = "n"."path") AND ("c"."level" = ("n"."level" + 1)))))
     LEFT JOIN "node_created_at" "nc" ON (("nc"."path" = "n"."path")))
  GROUP BY "n"."path", "n"."type", "n"."parent", "n"."level", "nc"."created_at"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."wikiTree" OWNER TO "postgres";


ALTER TABLE ONLY "public"."community_comments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."community_comments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."community_likes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."community_likes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."community_post_views" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."community_post_views_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."community_posts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."community_posts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."community_reports" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."community_reports_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."level_tags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."level_tags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."post_tags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."post_tags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."levels"
    ADD CONSTRAINT "79484035_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."APIKey"
    ADD CONSTRAINT "APIKey_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."APIKey"
    ADD CONSTRAINT "APIKey_pkey" PRIMARY KEY ("created_at");



ALTER TABLE ONLY "public"."PVPPlayers"
    ADD CONSTRAINT "PVPPlayers_pkey" PRIMARY KEY ("player", "room");



ALTER TABLE ONLY "public"."PVPRooms"
    ADD CONSTRAINT "PVPRoom_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "achievement_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "achievement_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."heatmap"
    ADD CONSTRAINT "attempts_pkey" PRIMARY KEY ("uid", "year");



ALTER TABLE ONLY "public"."battlePassLevelProgress"
    ADD CONSTRAINT "battlePassLevelProgress_pkey" PRIMARY KEY ("battlePassLevelId", "userID");



ALTER TABLE ONLY "public"."battlePassLevels"
    ADD CONSTRAINT "battlePassLevels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."battlePassMapPackLevelProgress"
    ADD CONSTRAINT "battlePassMapPackLevelProgress_pkey" PRIMARY KEY ("battlePassMapPackId", "levelID", "userID");



ALTER TABLE ONLY "public"."battlePassMapPackProgress"
    ADD CONSTRAINT "battlePassMapPackProgress_pkey" PRIMARY KEY ("battlePassMapPackId", "userID");



ALTER TABLE ONLY "public"."battlePassMapPacks"
    ADD CONSTRAINT "battlePassMapPacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."battlePassMissionClaims"
    ADD CONSTRAINT "battlePassMissionClaims_pkey" PRIMARY KEY ("missionId", "userID");



ALTER TABLE ONLY "public"."battlePassMissionProgress"
    ADD CONSTRAINT "battlePassMissionProgress_pkey" PRIMARY KEY ("missionId", "userID");



ALTER TABLE ONLY "public"."battlePassMissionRewards"
    ADD CONSTRAINT "battlePassMissionRewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."battlePassMissions"
    ADD CONSTRAINT "battlePassMissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."battlePassProgress"
    ADD CONSTRAINT "battlePassProgress_pkey" PRIMARY KEY ("seasonId", "userID");



ALTER TABLE ONLY "public"."battlePassRewardClaims"
    ADD CONSTRAINT "battlePassRewardClaims_pkey" PRIMARY KEY ("rewardId", "userID");



ALTER TABLE ONLY "public"."battlePassSeasons"
    ADD CONSTRAINT "battlePassSeasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."battlePassTierRewards"
    ADD CONSTRAINT "battlePassTierRewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."battlePassXPLogs"
    ADD CONSTRAINT "battlePassXPLogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."caseItems"
    ADD CONSTRAINT "caseItems_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."caseItems"
    ADD CONSTRAINT "caseItems_pkey" PRIMARY KEY ("itemId", "caseId");



ALTER TABLE ONLY "public"."caseResult"
    ADD CONSTRAINT "caseResult_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."changelogs"
    ADD CONSTRAINT "changelogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clanBan"
    ADD CONSTRAINT "clanBan_pkey" PRIMARY KEY ("userid", "clan");



ALTER TABLE ONLY "public"."clanInvitations"
    ADD CONSTRAINT "clanInvitations_pkey" PRIMARY KEY ("to");



ALTER TABLE ONLY "public"."clans"
    ADD CONSTRAINT "clans_owner_key" UNIQUE ("owner");



ALTER TABLE ONLY "public"."clans"
    ADD CONSTRAINT "clans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clans"
    ADD CONSTRAINT "clans_tag_key" UNIQUE ("tag");



ALTER TABLE ONLY "public"."community_comments_admin"
    ADD CONSTRAINT "community_comments_admin_pkey" PRIMARY KEY ("comment_id");



ALTER TABLE ONLY "public"."community_comments"
    ADD CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_likes"
    ADD CONSTRAINT "community_likes_comment_unique" UNIQUE ("uid", "comment_id");



ALTER TABLE ONLY "public"."community_likes"
    ADD CONSTRAINT "community_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_likes"
    ADD CONSTRAINT "community_likes_post_unique" UNIQUE ("uid", "post_id");



ALTER TABLE ONLY "public"."community_post_views"
    ADD CONSTRAINT "community_post_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_post_views"
    ADD CONSTRAINT "community_post_views_unique" UNIQUE ("uid", "post_id");



ALTER TABLE ONLY "public"."community_posts_admin"
    ADD CONSTRAINT "community_posts_admin_pkey" PRIMARY KEY ("post_id");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_posts_tags"
    ADD CONSTRAINT "community_posts_tags_pkey" PRIMARY KEY ("post_id", "tag_id");



ALTER TABLE ONLY "public"."community_reports"
    ADD CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_reports"
    ADD CONSTRAINT "community_reports_unique" UNIQUE ("uid", "post_id", "comment_id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."deathCount"
    ADD CONSTRAINT "deathCount_pkey" PRIMARY KEY ("levelID", "uid", "tag");



ALTER TABLE ONLY "public"."orderTracking"
    ADD CONSTRAINT "deliverySteps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eventLevelUnlockConditions"
    ADD CONSTRAINT "eventLevelUnlockConditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eventLevels"
    ADD CONSTRAINT "eventLevels_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."eventLevels"
    ADD CONSTRAINT "eventLevels_pkey" PRIMARY KEY ("eventID", "levelID");



ALTER TABLE ONLY "public"."eventProofs"
    ADD CONSTRAINT "eventProofs_pkey" PRIMARY KEY ("userid", "eventID");



ALTER TABLE ONLY "public"."eventQuestClaims"
    ADD CONSTRAINT "eventQuestClaims_pkey" PRIMARY KEY ("userId", "questId");



ALTER TABLE ONLY "public"."eventQuestRewards"
    ADD CONSTRAINT "eventQuestRewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eventQuests"
    ADD CONSTRAINT "eventQuests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eventRecords"
    ADD CONSTRAINT "eventRecords_pkey" PRIMARY KEY ("userID", "levelID");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."levelDeathCount"
    ADD CONSTRAINT "levelDeathCount_pkey" PRIMARY KEY ("levelID");



ALTER TABLE ONLY "public"."levelGDStates"
    ADD CONSTRAINT "levelGDStates_pkey" PRIMARY KEY ("levelId");



ALTER TABLE ONLY "public"."levelSubmissions"
    ADD CONSTRAINT "levelSubmissions_pkey" PRIMARY KEY ("userId", "levelId");



ALTER TABLE ONLY "public"."level_tags"
    ADD CONSTRAINT "level_tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."level_tags"
    ADD CONSTRAINT "level_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."levels"
    ADD CONSTRAINT "levels_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."levels_tags"
    ADD CONSTRAINT "levels_tags_pkey" PRIMARY KEY ("level_id", "tag_id");



ALTER TABLE ONLY "public"."mapPackLevels"
    ADD CONSTRAINT "mapPackLevels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mapPacks"
    ADD CONSTRAINT "mapPacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orderItems"
    ADD CONSTRAINT "orderItems_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."orderItems"
    ADD CONSTRAINT "orderItems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."otp"
    ADD CONSTRAINT "otp_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."playerSubscriptions"
    ADD CONSTRAINT "playerSubscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."playersAchievement"
    ADD CONSTRAINT "playersAchievement_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_discord_key" UNIQUE ("discord");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("uid");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pointercrate_key" UNIQUE ("pointercrate");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_uid_key" UNIQUE ("uid");



ALTER TABLE ONLY "public"."post_tags"
    ADD CONSTRAINT "post_tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."post_tags"
    ADD CONSTRAINT "post_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."records"
    ADD CONSTRAINT "records_pkey" PRIMARY KEY ("userid", "levelid");



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_pkey" PRIMARY KEY ("type", "lang");



ALTER TABLE ONLY "public"."itemTransactions"
    ADD CONSTRAINT "stackableItemTransactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."userSocial"
    ADD CONSTRAINT "userSocial_pkey" PRIMARY KEY ("platform", "id");



ALTER TABLE ONLY "public"."wiki"
    ADD CONSTRAINT "wiki_pkey" PRIMARY KEY ("path", "locale");



CREATE INDEX "battlePassMapPackLevelProgress_battlePassMapPackId_idx" ON "public"."battlePassMapPackLevelProgress" USING "btree" ("battlePassMapPackId");



CREATE INDEX "battlePassMapPackLevelProgress_userID_idx" ON "public"."battlePassMapPackLevelProgress" USING "btree" ("userID");



CREATE INDEX "battlePassXPLogs_seasonId_idx" ON "public"."battlePassXPLogs" USING "btree" ("seasonId");



CREATE INDEX "battlePassXPLogs_source_refId_idx" ON "public"."battlePassXPLogs" USING "btree" ("source", "refId");



CREATE INDEX "battlePassXPLogs_userID_idx" ON "public"."battlePassXPLogs" USING "btree" ("userID");



CREATE INDEX "idx_community_comments_admin_hidden" ON "public"."community_comments_admin" USING "btree" ("hidden");



CREATE INDEX "idx_community_comments_admin_status" ON "public"."community_comments_admin" USING "btree" ("moderation_status");



CREATE INDEX "idx_community_comments_hidden" ON "public"."community_comments" USING "btree" ("hidden");



CREATE INDEX "idx_community_comments_post_id" ON "public"."community_comments" USING "btree" ("post_id");



CREATE INDEX "idx_community_comments_uid" ON "public"."community_comments" USING "btree" ("uid");



CREATE INDEX "idx_community_likes_comment_id" ON "public"."community_likes" USING "btree" ("comment_id");



CREATE INDEX "idx_community_likes_post_id" ON "public"."community_likes" USING "btree" ("post_id");



CREATE INDEX "idx_community_likes_uid" ON "public"."community_likes" USING "btree" ("uid");



CREATE INDEX "idx_community_post_views_post_id" ON "public"."community_post_views" USING "btree" ("post_id");



CREATE INDEX "idx_community_post_views_uid" ON "public"."community_post_views" USING "btree" ("uid");



CREATE INDEX "idx_community_posts_admin_hidden" ON "public"."community_posts_admin" USING "btree" ("hidden");



CREATE INDEX "idx_community_posts_admin_status" ON "public"."community_posts_admin" USING "btree" ("moderation_status");



CREATE INDEX "idx_community_posts_created_at" ON "public"."community_posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_community_posts_fts" ON "public"."community_posts" USING "gin" ("fts");



CREATE INDEX "idx_community_posts_pinned" ON "public"."community_posts" USING "btree" ("pinned" DESC, "created_at" DESC);



CREATE INDEX "idx_community_posts_tags_post_id" ON "public"."community_posts_tags" USING "btree" ("post_id");



CREATE INDEX "idx_community_posts_tags_tag_id" ON "public"."community_posts_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_community_posts_type" ON "public"."community_posts" USING "btree" ("type");



CREATE INDEX "idx_community_posts_uid" ON "public"."community_posts" USING "btree" ("uid");



CREATE INDEX "idx_community_reports_post_id" ON "public"."community_reports" USING "btree" ("post_id");



CREATE INDEX "idx_community_reports_resolved" ON "public"."community_reports" USING "btree" ("resolved");



CREATE INDEX "idx_levels_main_level_id" ON "public"."levels" USING "btree" ("main_level_id");



CREATE INDEX "idx_levels_tags_level_id" ON "public"."levels_tags" USING "btree" ("level_id");



CREATE INDEX "idx_levels_tags_tag_id" ON "public"."levels_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_records_variant_id" ON "public"."records" USING "btree" ("variant_id");



CREATE UNIQUE INDEX "wikitree_path_uidx" ON "public"."wikiTree" USING "btree" ("path");



CREATE OR REPLACE TRIGGER "community_auto_hide_trigger" AFTER INSERT ON "public"."community_reports" FOR EACH ROW EXECUTE FUNCTION "public"."auto_hide_reported_content"();



CREATE OR REPLACE TRIGGER "community_comments_count_trigger" AFTER INSERT OR DELETE ON "public"."community_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_community_comments_count"();



CREATE OR REPLACE TRIGGER "community_likes_count_trigger" AFTER INSERT OR DELETE ON "public"."community_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_community_likes_count"();



CREATE OR REPLACE TRIGGER "community_post_views_count_trigger" AFTER INSERT ON "public"."community_post_views" FOR EACH ROW EXECUTE FUNCTION "public"."update_community_post_views_count"();



CREATE OR REPLACE TRIGGER "trigger_refresh_wiki_tree" AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON "public"."wiki" FOR EACH STATEMENT EXECUTE FUNCTION "public"."refresh_wiki_tree"();



ALTER TABLE ONLY "public"."PVPPlayers"
    ADD CONSTRAINT "PVPPlayers_player_fkey" FOREIGN KEY ("player") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PVPPlayers"
    ADD CONSTRAINT "PVPPlayers_room_fkey" FOREIGN KEY ("room") REFERENCES "public"."PVPRooms"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PVPRooms"
    ADD CONSTRAINT "PVPRoom_host_fkey" FOREIGN KEY ("host") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."battlePassLevelProgress"
    ADD CONSTRAINT "battlePassLevelProgress_battlePassLevelId_fkey" FOREIGN KEY ("battlePassLevelId") REFERENCES "public"."battlePassLevels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassLevelProgress"
    ADD CONSTRAINT "battlePassLevelProgress_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassLevels"
    ADD CONSTRAINT "battlePassLevels_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES "public"."levels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassLevels"
    ADD CONSTRAINT "battlePassLevels_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."battlePassSeasons"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMapPackLevelProgress"
    ADD CONSTRAINT "battlePassMapPackLevelProgress_battlePassMapPackId_fkey" FOREIGN KEY ("battlePassMapPackId") REFERENCES "public"."battlePassMapPacks"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMapPackLevelProgress"
    ADD CONSTRAINT "battlePassMapPackLevelProgress_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMapPackProgress"
    ADD CONSTRAINT "battlePassMapPackProgress_battlePassMapPackId_fkey" FOREIGN KEY ("battlePassMapPackId") REFERENCES "public"."battlePassMapPacks"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMapPackProgress"
    ADD CONSTRAINT "battlePassMapPackProgress_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMapPacks"
    ADD CONSTRAINT "battlePassMapPacks_mapPackId_fkey" FOREIGN KEY ("mapPackId") REFERENCES "public"."mapPacks"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMapPacks"
    ADD CONSTRAINT "battlePassMapPacks_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."battlePassSeasons"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMissionClaims"
    ADD CONSTRAINT "battlePassMissionClaims_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "public"."battlePassMissions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMissionClaims"
    ADD CONSTRAINT "battlePassMissionClaims_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMissionProgress"
    ADD CONSTRAINT "battlePassMissionProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "public"."battlePassMissions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMissionProgress"
    ADD CONSTRAINT "battlePassMissionProgress_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMissionRewards"
    ADD CONSTRAINT "battlePassMissionRewards_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMissionRewards"
    ADD CONSTRAINT "battlePassMissionRewards_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "public"."battlePassMissions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassMissions"
    ADD CONSTRAINT "battlePassMissions_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."battlePassSeasons"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassProgress"
    ADD CONSTRAINT "battlePassProgress_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."battlePassSeasons"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassProgress"
    ADD CONSTRAINT "battlePassProgress_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassRewardClaims"
    ADD CONSTRAINT "battlePassRewardClaims_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "public"."battlePassTierRewards"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassRewardClaims"
    ADD CONSTRAINT "battlePassRewardClaims_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassTierRewards"
    ADD CONSTRAINT "battlePassTierRewards_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassTierRewards"
    ADD CONSTRAINT "battlePassTierRewards_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."battlePassSeasons"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassXPLogs"
    ADD CONSTRAINT "battlePassXPLogs_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."battlePassSeasons"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battlePassXPLogs"
    ADD CONSTRAINT "battlePassXPLogs_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_owner_fkey" FOREIGN KEY ("owner") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."caseItems"
    ADD CONSTRAINT "caseItems_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."caseItems"
    ADD CONSTRAINT "caseItems_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."caseResult"
    ADD CONSTRAINT "caseResult_caseId_fkey1" FOREIGN KEY ("caseId") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."caseResult"
    ADD CONSTRAINT "caseResult_openerId_fkey" FOREIGN KEY ("openerId") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."caseResult"
    ADD CONSTRAINT "caseResult_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "public"."caseItems"("id");



ALTER TABLE ONLY "public"."changelogs"
    ADD CONSTRAINT "changelogs_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES "public"."levels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clanBan"
    ADD CONSTRAINT "clanBan_clan_fkey" FOREIGN KEY ("clan") REFERENCES "public"."clans"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clanBan"
    ADD CONSTRAINT "clanBan_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clanInvitations"
    ADD CONSTRAINT "clanInvitations_clan_fkey" FOREIGN KEY ("clan") REFERENCES "public"."clans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clanInvitations"
    ADD CONSTRAINT "clanInvitations_to_fkey" FOREIGN KEY ("to") REFERENCES "public"."players"("uid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clans"
    ADD CONSTRAINT "clans_owner_fkey" FOREIGN KEY ("owner") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."community_comments_admin"
    ADD CONSTRAINT "community_comments_admin_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."community_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_comments"
    ADD CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_comments"
    ADD CONSTRAINT "community_comments_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_likes"
    ADD CONSTRAINT "community_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."community_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_likes"
    ADD CONSTRAINT "community_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_likes"
    ADD CONSTRAINT "community_likes_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_post_views"
    ADD CONSTRAINT "community_post_views_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_post_views"
    ADD CONSTRAINT "community_post_views_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_posts_admin"
    ADD CONSTRAINT "community_posts_admin_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_posts_tags"
    ADD CONSTRAINT "community_posts_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_posts_tags"
    ADD CONSTRAINT "community_posts_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."post_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_reports"
    ADD CONSTRAINT "community_reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."community_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_reports"
    ADD CONSTRAINT "community_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_reports"
    ADD CONSTRAINT "community_reports_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_owner_fkey" FOREIGN KEY ("owner") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_productID_fkey" FOREIGN KEY ("productID") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."orderTracking"
    ADD CONSTRAINT "deliverySteps_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."eventLevelUnlockConditions"
    ADD CONSTRAINT "eventLevelUnlockConditions_eventLevelId_fkey" FOREIGN KEY ("eventLevelId") REFERENCES "public"."eventLevels"("id");



ALTER TABLE ONLY "public"."eventLevelUnlockConditions"
    ADD CONSTRAINT "eventLevelUnlockConditions_requireEventLevelId_fkey" FOREIGN KEY ("requireEventLevelId") REFERENCES "public"."eventLevels"("id");



ALTER TABLE ONLY "public"."eventLevels"
    ADD CONSTRAINT "eventLevels_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."eventLevels"
    ADD CONSTRAINT "eventLevels_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES "public"."levels"("id");



ALTER TABLE ONLY "public"."eventProofs"
    ADD CONSTRAINT "eventProofs_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES "public"."events"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."eventProofs"
    ADD CONSTRAINT "eventProofs_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."eventQuestClaims"
    ADD CONSTRAINT "eventQuestClaims_questId_fkey" FOREIGN KEY ("questId") REFERENCES "public"."eventQuests"("id");



ALTER TABLE ONLY "public"."eventQuestClaims"
    ADD CONSTRAINT "eventQuestClaims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."eventQuestRewards"
    ADD CONSTRAINT "eventQuestRewards_questId_fkey" FOREIGN KEY ("questId") REFERENCES "public"."eventQuests"("id");



ALTER TABLE ONLY "public"."eventQuestRewards"
    ADD CONSTRAINT "eventQuestRewards_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."eventQuests"
    ADD CONSTRAINT "eventQuests_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."eventRecords"
    ADD CONSTRAINT "eventRecords_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES "public"."eventLevels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."levelGDStates"
    ADD CONSTRAINT "levelGDStates_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "public"."levels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."levelSubmissions"
    ADD CONSTRAINT "levelSubmissions_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "public"."levels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."levelSubmissions"
    ADD CONSTRAINT "levelSubmissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."levels"
    ADD CONSTRAINT "levels_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."levels"
    ADD CONSTRAINT "levels_main_level_id_fkey" FOREIGN KEY ("main_level_id") REFERENCES "public"."levels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."levels_tags"
    ADD CONSTRAINT "levels_tags_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."levels_tags"
    ADD CONSTRAINT "levels_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."level_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mapPackLevels"
    ADD CONSTRAINT "mapPackLevels_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES "public"."levels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mapPackLevels"
    ADD CONSTRAINT "mapPackLevels_mapPackId_fkey" FOREIGN KEY ("mapPackId") REFERENCES "public"."mapPacks"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_to_fkey" FOREIGN KEY ("to") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."orderItems"
    ADD CONSTRAINT "orderItems_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "public"."orders"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orderItems"
    ADD CONSTRAINT "orderItems_productID_fkey" FOREIGN KEY ("productID") REFERENCES "public"."products"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_coupon_fkey" FOREIGN KEY ("coupon") REFERENCES "public"."coupons"("code");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_giftTo_fkey" FOREIGN KEY ("giftTo") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_productID_fkey" FOREIGN KEY ("productID") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_targetClanID_fkey" FOREIGN KEY ("targetClanID") REFERENCES "public"."clans"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."otp"
    ADD CONSTRAINT "otp_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."players"("uid") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "playerMedal_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."playerSubscriptions"
    ADD CONSTRAINT "playerSubscriptions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playerSubscriptions"
    ADD CONSTRAINT "playerSubscriptions_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."playersAchievement"
    ADD CONSTRAINT "playersAchievement_achievementid_fkey" FOREIGN KEY ("achievementid") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."playersAchievement"
    ADD CONSTRAINT "playersAchievement_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_clan_fkey" FOREIGN KEY ("clan") REFERENCES "public"."clans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."APIKey"
    ADD CONSTRAINT "public_APIKey_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."heatmap"
    ADD CONSTRAINT "public_attempts_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deathCount"
    ADD CONSTRAINT "public_deathCount_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."records"
    ADD CONSTRAINT "public_records_levelid_fkey" FOREIGN KEY ("levelid") REFERENCES "public"."levels"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."records"
    ADD CONSTRAINT "public_records_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."eventRecords"
    ADD CONSTRAINT "qualifier_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid");



ALTER TABLE ONLY "public"."records"
    ADD CONSTRAINT "records_reviewer_fkey" FOREIGN KEY ("reviewer") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."records"
    ADD CONSTRAINT "records_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."levels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."itemTransactions"
    ADD CONSTRAINT "stackableItemTransactions_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."inventory"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."userSocial"
    ADD CONSTRAINT "userSocial_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE "public"."APIKey" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Enable delete for users based on user_id" ON "public"."records" FOR DELETE USING ((("auth"."uid"() = "userid") AND ("isChecked" = false)));



CREATE POLICY "Enable read access for all users" ON "public"."clans" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."items" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."levels" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."notifications" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."players" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."playersAchievement" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."records" FOR SELECT USING (true);



ALTER TABLE "public"."PVPPlayers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."PVPRooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassLevelProgress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassLevels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassMapPackLevelProgress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassMapPackProgress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassMapPacks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassMissionClaims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassMissionProgress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassMissionRewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassMissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassProgress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassRewardClaims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassSeasons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassTierRewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battlePassXPLogs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."caseItems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."caseResult" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."changelogs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clanBan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clanInvitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_comments_admin" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "community_comments_delete" ON "public"."community_comments" FOR DELETE USING (("auth"."uid"() = "uid"));



CREATE POLICY "community_comments_insert" ON "public"."community_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "uid"));



CREATE POLICY "community_comments_read" ON "public"."community_comments" FOR SELECT USING (true);



ALTER TABLE "public"."community_likes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "community_likes_delete" ON "public"."community_likes" FOR DELETE USING (("auth"."uid"() = "uid"));



CREATE POLICY "community_likes_insert" ON "public"."community_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "uid"));



CREATE POLICY "community_likes_read" ON "public"."community_likes" FOR SELECT USING (true);



ALTER TABLE "public"."community_post_views" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "community_post_views_insert" ON "public"."community_post_views" FOR INSERT WITH CHECK (("auth"."uid"() = "uid"));



CREATE POLICY "community_post_views_read" ON "public"."community_post_views" FOR SELECT USING (true);



CREATE POLICY "community_post_views_update" ON "public"."community_post_views" FOR UPDATE USING (("auth"."uid"() = "uid"));



ALTER TABLE "public"."community_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_posts_admin" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "community_posts_delete" ON "public"."community_posts" FOR DELETE USING (("auth"."uid"() = "uid"));



CREATE POLICY "community_posts_insert" ON "public"."community_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "uid"));



CREATE POLICY "community_posts_read" ON "public"."community_posts" FOR SELECT USING (true);



ALTER TABLE "public"."community_posts_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "community_posts_update" ON "public"."community_posts" FOR UPDATE USING (("auth"."uid"() = "uid"));



ALTER TABLE "public"."community_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "community_reports_delete" ON "public"."community_reports" FOR DELETE USING (("auth"."uid"() = "uid"));



CREATE POLICY "community_reports_insert" ON "public"."community_reports" FOR INSERT WITH CHECK (("auth"."uid"() = "uid"));



CREATE POLICY "community_reports_read" ON "public"."community_reports" FOR SELECT USING (true);



ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deathCount" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eventLevelUnlockConditions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eventLevels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eventProofs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eventQuestClaims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eventQuestRewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eventQuests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eventRecords" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."heatmap" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."itemTransactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."levelDeathCount" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."levelGDStates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."levelSubmissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."level_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."levels_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mapPackLevels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mapPacks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orderItems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orderTracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."otp" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playerSubscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playersAchievement" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."userSocial" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wiki" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."add_event_levels_progress"("updates" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_event_levels_progress"("updates" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_event_levels_progress"("updates" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_hide_reported_content"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_hide_reported_content"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_hide_reported_content"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_hide_reported_posts"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_hide_reported_posts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_hide_reported_posts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_leaderboard"("event_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_leaderboard"("event_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_leaderboard"("event_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_queue_no"("userid" "uuid", "levelid" bigint, "p" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_queue_no"("userid" "uuid", "levelid" bigint, "p" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_queue_no"("userid" "uuid", "levelid" bigint, "p" bigint) TO "service_role";



GRANT ALL ON TABLE "public"."levels" TO "anon";
GRANT ALL ON TABLE "public"."levels" TO "authenticated";
GRANT ALL ON TABLE "public"."levels" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_random_levels"("row_count" integer, "filter_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_random_levels"("row_count" integer, "filter_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_random_levels"("row_count" integer, "filter_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recommended_community_posts"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer, "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_recommended_community_posts"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer, "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recommended_community_posts"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer, "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_buyers"("interval_ms" bigint, "limit_count" integer, "offset_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_buyers"("interval_ms" bigint, "limit_count" integer, "offset_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_buyers"("interval_ms" bigint, "limit_count" integer, "offset_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."record_community_post_view"("p_user_id" "uuid", "p_post_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."record_community_post_view"("p_user_id" "uuid", "p_post_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_community_post_view"("p_user_id" "uuid", "p_post_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_wiki_tree"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_wiki_tree"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_wiki_tree"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_community_comment_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_community_comment_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_community_comment_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_community_comments_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_community_comments_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_community_comments_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_community_like_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_community_like_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_community_like_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_community_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_community_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_community_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_community_post_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_community_post_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_community_post_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_community_post_views_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_community_post_views_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_community_post_views_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_list"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_list"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_list"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_rank"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_rank"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_rank"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_supporter_until"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_supporter_until"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_supporter_until"() TO "service_role";












SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;









GRANT ALL ON TABLE "public"."APIKey" TO "anon";
GRANT ALL ON TABLE "public"."APIKey" TO "authenticated";
GRANT ALL ON TABLE "public"."APIKey" TO "service_role";



GRANT ALL ON TABLE "public"."PVPPlayers" TO "anon";
GRANT ALL ON TABLE "public"."PVPPlayers" TO "authenticated";
GRANT ALL ON TABLE "public"."PVPPlayers" TO "service_role";



GRANT ALL ON TABLE "public"."PVPRooms" TO "anon";
GRANT ALL ON TABLE "public"."PVPRooms" TO "authenticated";
GRANT ALL ON TABLE "public"."PVPRooms" TO "service_role";



GRANT ALL ON SEQUENCE "public"."PVPRoom_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."PVPRoom_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."PVPRoom_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."achievement_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."achievement_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."achievement_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassLevelProgress" TO "anon";
GRANT ALL ON TABLE "public"."battlePassLevelProgress" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassLevelProgress" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassLevels" TO "anon";
GRANT ALL ON TABLE "public"."battlePassLevels" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassLevels" TO "service_role";



GRANT ALL ON SEQUENCE "public"."battlePassLevels_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."battlePassLevels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."battlePassLevels_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassMapPackLevelProgress" TO "anon";
GRANT ALL ON TABLE "public"."battlePassMapPackLevelProgress" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassMapPackLevelProgress" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassMapPackProgress" TO "anon";
GRANT ALL ON TABLE "public"."battlePassMapPackProgress" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassMapPackProgress" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassMapPacks" TO "anon";
GRANT ALL ON TABLE "public"."battlePassMapPacks" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassMapPacks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."battlePassMapPacks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."battlePassMapPacks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."battlePassMapPacks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassMissionClaims" TO "anon";
GRANT ALL ON TABLE "public"."battlePassMissionClaims" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassMissionClaims" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassMissionProgress" TO "anon";
GRANT ALL ON TABLE "public"."battlePassMissionProgress" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassMissionProgress" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassMissionRewards" TO "anon";
GRANT ALL ON TABLE "public"."battlePassMissionRewards" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassMissionRewards" TO "service_role";



GRANT ALL ON SEQUENCE "public"."battlePassMissionRewards_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."battlePassMissionRewards_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."battlePassMissionRewards_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassMissions" TO "anon";
GRANT ALL ON TABLE "public"."battlePassMissions" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassMissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."battlePassMissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."battlePassMissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."battlePassMissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassProgress" TO "anon";
GRANT ALL ON TABLE "public"."battlePassProgress" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassProgress" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassRewardClaims" TO "anon";
GRANT ALL ON TABLE "public"."battlePassRewardClaims" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassRewardClaims" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassSeasons" TO "anon";
GRANT ALL ON TABLE "public"."battlePassSeasons" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassSeasons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."battlePassSeasons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."battlePassSeasons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."battlePassSeasons_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassTierRewards" TO "anon";
GRANT ALL ON TABLE "public"."battlePassTierRewards" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassTierRewards" TO "service_role";



GRANT ALL ON SEQUENCE "public"."battlePassTierRewards_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."battlePassTierRewards_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."battlePassTierRewards_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."battlePassXPLogs" TO "anon";
GRANT ALL ON TABLE "public"."battlePassXPLogs" TO "authenticated";
GRANT ALL ON TABLE "public"."battlePassXPLogs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."battlePassXPLogs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."battlePassXPLogs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."battlePassXPLogs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cards" TO "anon";
GRANT ALL ON TABLE "public"."cards" TO "authenticated";
GRANT ALL ON TABLE "public"."cards" TO "service_role";



GRANT ALL ON TABLE "public"."caseItems" TO "anon";
GRANT ALL ON TABLE "public"."caseItems" TO "authenticated";
GRANT ALL ON TABLE "public"."caseItems" TO "service_role";



GRANT ALL ON SEQUENCE "public"."caseItems_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."caseItems_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."caseItems_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."caseResult" TO "anon";
GRANT ALL ON TABLE "public"."caseResult" TO "authenticated";
GRANT ALL ON TABLE "public"."caseResult" TO "service_role";



GRANT ALL ON SEQUENCE "public"."caseResult_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."caseResult_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."caseResult_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."changelogs" TO "anon";
GRANT ALL ON TABLE "public"."changelogs" TO "authenticated";
GRANT ALL ON TABLE "public"."changelogs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."changelogs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."changelogs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."changelogs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."clanBan" TO "anon";
GRANT ALL ON TABLE "public"."clanBan" TO "authenticated";
GRANT ALL ON TABLE "public"."clanBan" TO "service_role";



GRANT ALL ON TABLE "public"."clanInvitations" TO "anon";
GRANT ALL ON TABLE "public"."clanInvitations" TO "authenticated";
GRANT ALL ON TABLE "public"."clanInvitations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."clanInvitations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."clanInvitations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."clanInvitations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."clans" TO "anon";
GRANT ALL ON TABLE "public"."clans" TO "authenticated";
GRANT ALL ON TABLE "public"."clans" TO "service_role";



GRANT ALL ON SEQUENCE "public"."clans_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."clans_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."clans_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."community_comments" TO "anon";
GRANT ALL ON TABLE "public"."community_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."community_comments" TO "service_role";



GRANT ALL ON TABLE "public"."community_comments_admin" TO "anon";
GRANT ALL ON TABLE "public"."community_comments_admin" TO "authenticated";
GRANT ALL ON TABLE "public"."community_comments_admin" TO "service_role";



GRANT ALL ON SEQUENCE "public"."community_comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."community_comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."community_comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."community_likes" TO "anon";
GRANT ALL ON TABLE "public"."community_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."community_likes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."community_likes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."community_likes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."community_likes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."community_post_views" TO "anon";
GRANT ALL ON TABLE "public"."community_post_views" TO "authenticated";
GRANT ALL ON TABLE "public"."community_post_views" TO "service_role";



GRANT ALL ON SEQUENCE "public"."community_post_views_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."community_post_views_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."community_post_views_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."community_posts" TO "anon";
GRANT ALL ON TABLE "public"."community_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."community_posts" TO "service_role";



GRANT ALL ON TABLE "public"."community_posts_admin" TO "anon";
GRANT ALL ON TABLE "public"."community_posts_admin" TO "authenticated";
GRANT ALL ON TABLE "public"."community_posts_admin" TO "service_role";



GRANT ALL ON SEQUENCE "public"."community_posts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."community_posts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."community_posts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."community_posts_tags" TO "anon";
GRANT ALL ON TABLE "public"."community_posts_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."community_posts_tags" TO "service_role";



GRANT ALL ON TABLE "public"."community_reports" TO "anon";
GRANT ALL ON TABLE "public"."community_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."community_reports" TO "service_role";



GRANT ALL ON SEQUENCE "public"."community_reports_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."community_reports_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."community_reports_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."deathCount" TO "anon";
GRANT ALL ON TABLE "public"."deathCount" TO "authenticated";
GRANT ALL ON TABLE "public"."deathCount" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deathCount_levelID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deathCount_levelID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deathCount_levelID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."eventLevelUnlockConditions" TO "anon";
GRANT ALL ON TABLE "public"."eventLevelUnlockConditions" TO "authenticated";
GRANT ALL ON TABLE "public"."eventLevelUnlockConditions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."eventLevelUnlockConditions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."eventLevelUnlockConditions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."eventLevelUnlockConditions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."eventLevels" TO "anon";
GRANT ALL ON TABLE "public"."eventLevels" TO "authenticated";
GRANT ALL ON TABLE "public"."eventLevels" TO "service_role";



GRANT ALL ON SEQUENCE "public"."eventLevels_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."eventLevels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."eventLevels_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."eventProofs" TO "anon";
GRANT ALL ON TABLE "public"."eventProofs" TO "authenticated";
GRANT ALL ON TABLE "public"."eventProofs" TO "service_role";



GRANT ALL ON TABLE "public"."eventQuestClaims" TO "anon";
GRANT ALL ON TABLE "public"."eventQuestClaims" TO "authenticated";
GRANT ALL ON TABLE "public"."eventQuestClaims" TO "service_role";



GRANT ALL ON TABLE "public"."eventQuestRewards" TO "anon";
GRANT ALL ON TABLE "public"."eventQuestRewards" TO "authenticated";
GRANT ALL ON TABLE "public"."eventQuestRewards" TO "service_role";



GRANT ALL ON SEQUENCE "public"."eventQuestRewards_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."eventQuestRewards_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."eventQuestRewards_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."eventQuests" TO "anon";
GRANT ALL ON TABLE "public"."eventQuests" TO "authenticated";
GRANT ALL ON TABLE "public"."eventQuests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."eventQuests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."eventQuests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."eventQuests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."eventRecords" TO "anon";
GRANT ALL ON TABLE "public"."eventRecords" TO "authenticated";
GRANT ALL ON TABLE "public"."eventRecords" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."heatmap" TO "anon";
GRANT ALL ON TABLE "public"."heatmap" TO "authenticated";
GRANT ALL ON TABLE "public"."heatmap" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON SEQUENCE "public"."inventory_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."inventory_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."inventory_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."itemTransactions" TO "anon";
GRANT ALL ON TABLE "public"."itemTransactions" TO "authenticated";
GRANT ALL ON TABLE "public"."itemTransactions" TO "service_role";



GRANT ALL ON TABLE "public"."levelDeathCount" TO "anon";
GRANT ALL ON TABLE "public"."levelDeathCount" TO "authenticated";
GRANT ALL ON TABLE "public"."levelDeathCount" TO "service_role";



GRANT ALL ON SEQUENCE "public"."levelDeathCount_levelID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."levelDeathCount_levelID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."levelDeathCount_levelID_seq" TO "service_role";



GRANT ALL ON TABLE "public"."levelGDStates" TO "anon";
GRANT ALL ON TABLE "public"."levelGDStates" TO "authenticated";
GRANT ALL ON TABLE "public"."levelGDStates" TO "service_role";



GRANT ALL ON TABLE "public"."levelSubmissions" TO "anon";
GRANT ALL ON TABLE "public"."levelSubmissions" TO "authenticated";
GRANT ALL ON TABLE "public"."levelSubmissions" TO "service_role";



GRANT ALL ON TABLE "public"."level_tags" TO "anon";
GRANT ALL ON TABLE "public"."level_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."level_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."level_tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."level_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."level_tags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."levels_tags" TO "anon";
GRANT ALL ON TABLE "public"."levels_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."levels_tags" TO "service_role";



GRANT ALL ON TABLE "public"."mapPackLevels" TO "anon";
GRANT ALL ON TABLE "public"."mapPackLevels" TO "authenticated";
GRANT ALL ON TABLE "public"."mapPackLevels" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mapPackLevels_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mapPackLevels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mapPackLevels_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."mapPacks" TO "anon";
GRANT ALL ON TABLE "public"."mapPacks" TO "authenticated";
GRANT ALL ON TABLE "public"."mapPacks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mapPacks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mapPacks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mapPacks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orderItems" TO "anon";
GRANT ALL ON TABLE "public"."orderItems" TO "authenticated";
GRANT ALL ON TABLE "public"."orderItems" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orderItems_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orderItems_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orderItems_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orderTracking" TO "anon";
GRANT ALL ON TABLE "public"."orderTracking" TO "authenticated";
GRANT ALL ON TABLE "public"."orderTracking" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orderTracking_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orderTracking_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orderTracking_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."otp" TO "anon";
GRANT ALL ON TABLE "public"."otp" TO "authenticated";
GRANT ALL ON TABLE "public"."otp" TO "service_role";



GRANT ALL ON TABLE "public"."playerSubscriptions" TO "anon";
GRANT ALL ON TABLE "public"."playerSubscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."playerSubscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."playerSubscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."playerSubscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."playerSubscriptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."playersAchievement" TO "anon";
GRANT ALL ON TABLE "public"."playersAchievement" TO "authenticated";
GRANT ALL ON TABLE "public"."playersAchievement" TO "service_role";



GRANT ALL ON SEQUENCE "public"."playersAchievement_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."playersAchievement_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."playersAchievement_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."post_tags" TO "anon";
GRANT ALL ON TABLE "public"."post_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."post_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."post_tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."post_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."post_tags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."promotions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."promotions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."promotions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."records" TO "anon";
GRANT ALL ON TABLE "public"."records" TO "authenticated";
GRANT ALL ON TABLE "public"."records" TO "service_role";



GRANT ALL ON TABLE "public"."rules" TO "anon";
GRANT ALL ON TABLE "public"."rules" TO "authenticated";
GRANT ALL ON TABLE "public"."rules" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stackableItemTransactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stackableItemTransactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stackableItemTransactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."userSocial" TO "anon";
GRANT ALL ON TABLE "public"."userSocial" TO "authenticated";
GRANT ALL ON TABLE "public"."userSocial" TO "service_role";



GRANT ALL ON TABLE "public"."wiki" TO "anon";
GRANT ALL ON TABLE "public"."wiki" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki" TO "service_role";



GRANT ALL ON TABLE "public"."wikiTree" TO "anon";
GRANT ALL ON TABLE "public"."wikiTree" TO "authenticated";
GRANT ALL ON TABLE "public"."wikiTree" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


































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


CREATE SCHEMA IF NOT EXISTS "levels";


ALTER SCHEMA "levels" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";








ALTER SCHEMA "public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






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


CREATE OR REPLACE FUNCTION "public"."getEventLeaderboard"("event_id" integer) RETURNS TABLE("userID" "uuid", "elo" bigint, "matchCount" bigint, "point" numeric, "penalty" numeric)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."getEventLeaderboard"("event_id" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."levels" (
    "id" bigint NOT NULL,
    "name" character varying DEFAULT 'N/a'::character varying,
    "creator" character varying DEFAULT 'N/a'::character varying,
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
    "isNonList" boolean DEFAULT false NOT NULL
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


CREATE OR REPLACE FUNCTION "public"."updateList"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$begin
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
end$$;


ALTER FUNCTION "public"."updateList"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."updateRank"() RETURNS "void"
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
end$$;


ALTER FUNCTION "public"."updateRank"() OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "levels"."79484035" (
    "id" bigint DEFAULT '79484035'::bigint,
    "name" character varying,
    "creator" character varying,
    "videoID" character varying,
    "verifier" character varying,
    "firstVictor" character varying,
    "top" bigint
);


ALTER TABLE "levels"."79484035" OWNER TO "postgres";


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
    "old" "json",
    "new" "json" NOT NULL,
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
    "redirectTo" "text"
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
    "plPt" double precision
);


ALTER TABLE "public"."records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rules" (
    "type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "lang" "text" NOT NULL
);


ALTER TABLE "public"."rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."userSocial" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "platform" "text" NOT NULL,
    "id" "text" NOT NULL,
    "userid" "uuid" NOT NULL,
    "isVisible" boolean DEFAULT false NOT NULL,
    "name" "text"
);


ALTER TABLE "public"."userSocial" OWNER TO "postgres";


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



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."deathCount"
    ADD CONSTRAINT "deathCount_pkey" PRIMARY KEY ("levelID", "uid");



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



ALTER TABLE ONLY "public"."levels"
    ADD CONSTRAINT "levels_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orderItems"
    ADD CONSTRAINT "orderItems_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."orderItems"
    ADD CONSTRAINT "orderItems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."records"
    ADD CONSTRAINT "records_pkey" PRIMARY KEY ("userid", "levelid");



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_pkey" PRIMARY KEY ("type", "lang");



ALTER TABLE ONLY "public"."userSocial"
    ADD CONSTRAINT "userSocial_pkey" PRIMARY KEY ("platform", "id");



ALTER TABLE ONLY "public"."PVPPlayers"
    ADD CONSTRAINT "PVPPlayers_player_fkey" FOREIGN KEY ("player") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PVPPlayers"
    ADD CONSTRAINT "PVPPlayers_room_fkey" FOREIGN KEY ("room") REFERENCES "public"."PVPRooms"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PVPRooms"
    ADD CONSTRAINT "PVPRoom_host_fkey" FOREIGN KEY ("host") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE SET NULL;



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
    ADD CONSTRAINT "eventRecords_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES "public"."eventLevels"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id");



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



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "playerMedal_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."players"("uid");



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



ALTER TABLE ONLY "public"."userSocial"
    ADD CONSTRAINT "userSocial_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE "levels"."79484035" ENABLE ROW LEVEL SECURITY;


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


ALTER TABLE "public"."cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."caseItems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."caseResult" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."changelogs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clanBan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clanInvitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clans" ENABLE ROW LEVEL SECURITY;


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


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."levelDeathCount" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orderItems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orderTracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."playersAchievement" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."userSocial" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."add_event_levels_progress"("updates" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_event_levels_progress"("updates" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_event_levels_progress"("updates" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."getEventLeaderboard"("event_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."getEventLeaderboard"("event_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."getEventLeaderboard"("event_id" integer) TO "service_role";



GRANT ALL ON TABLE "public"."levels" TO "anon";
GRANT ALL ON TABLE "public"."levels" TO "authenticated";
GRANT ALL ON TABLE "public"."levels" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_random_levels"("row_count" integer, "filter_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_random_levels"("row_count" integer, "filter_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_random_levels"("row_count" integer, "filter_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."updateList"() TO "anon";
GRANT ALL ON FUNCTION "public"."updateList"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."updateList"() TO "service_role";



GRANT ALL ON FUNCTION "public"."updateRank"() TO "anon";
GRANT ALL ON FUNCTION "public"."updateRank"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."updateRank"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_supporter_until"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_supporter_until"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_supporter_until"() TO "service_role";
























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



GRANT ALL ON TABLE "public"."levelDeathCount" TO "anon";
GRANT ALL ON TABLE "public"."levelDeathCount" TO "authenticated";
GRANT ALL ON TABLE "public"."levelDeathCount" TO "service_role";



GRANT ALL ON SEQUENCE "public"."levelDeathCount_levelID_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."levelDeathCount_levelID_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."levelDeathCount_levelID_seq" TO "service_role";



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



GRANT ALL ON TABLE "public"."userSocial" TO "anon";
GRANT ALL ON TABLE "public"."userSocial" TO "authenticated";
GRANT ALL ON TABLE "public"."userSocial" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";































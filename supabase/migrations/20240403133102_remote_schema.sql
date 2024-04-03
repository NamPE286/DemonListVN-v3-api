
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

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "extensions";

CREATE SCHEMA IF NOT EXISTS "levels";

ALTER SCHEMA "levels" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

CREATE SCHEMA IF NOT EXISTS "public";

ALTER SCHEMA "public" OWNER TO "postgres";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

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
end$$;

ALTER FUNCTION "public"."updateList"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."updateRank"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$begin
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
end$$;

ALTER FUNCTION "public"."updateRank"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

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

CREATE TABLE IF NOT EXISTS "public"."achievement" (
    "id" bigint NOT NULL,
    "name" character varying DEFAULT 'defaultname'::character varying NOT NULL,
    "timestamp" bigint DEFAULT '0'::bigint NOT NULL,
    "image" character varying
);

ALTER TABLE "public"."achievement" OWNER TO "postgres";

ALTER TABLE "public"."achievement" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."achievement_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."levels" (
    "id" bigint NOT NULL,
    "name" character varying DEFAULT 'N/a'::character varying,
    "creator" character varying DEFAULT 'N/a'::character varying,
    "videoID" character varying DEFAULT 'N/a'::character varying,
    "minProgress" bigint DEFAULT '100'::bigint,
    "flTop" double precision,
    "dlTop" double precision,
    "flPt" double precision,
    "dlPt" double precision,
    "rating" bigint,
    "songID" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."levels" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "content" "text",
    "to" "uuid" NOT NULL,
    "status" bigint DEFAULT '0'::bigint NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL
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

CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" bigint NOT NULL,
    "name" character varying NOT NULL,
    "email" character varying,
    "avatar" character varying,
    "facebook" character varying,
    "youtube" character varying,
    "discord" character varying,
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
    "city" "text"
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

CREATE TABLE IF NOT EXISTS "public"."records" (
    "videoLink" character varying,
    "refreshRate" bigint DEFAULT '60'::bigint,
    "progress" bigint DEFAULT '0'::bigint,
    "timestamp" bigint DEFAULT '0'::bigint,
    "flPt" double precision,
    "dlPt" double precision,
    "userid" "uuid" NOT NULL,
    "levelid" bigint NOT NULL,
    "mobile" boolean DEFAULT false NOT NULL,
    "isChecked" boolean DEFAULT false,
    "comment" character varying
);

ALTER TABLE "public"."records" OWNER TO "postgres";

ALTER TABLE ONLY "public"."levels"
    ADD CONSTRAINT "79484035_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."achievement"
    ADD CONSTRAINT "achievement_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."achievement"
    ADD CONSTRAINT "achievement_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."playersAchievement"
    ADD CONSTRAINT "playersAchievement_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("uid");

ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_uid_key" UNIQUE ("uid");

ALTER TABLE ONLY "public"."records"
    ADD CONSTRAINT "records_pkey" PRIMARY KEY ("userid", "levelid");

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_to_fkey" FOREIGN KEY ("to") REFERENCES "public"."players"("uid");

ALTER TABLE ONLY "public"."playersAchievement"
    ADD CONSTRAINT "playersAchievement_achievementid_fkey" FOREIGN KEY ("achievementid") REFERENCES "public"."achievement"("id");

ALTER TABLE ONLY "public"."playersAchievement"
    ADD CONSTRAINT "playersAchievement_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."players"("uid");

ALTER TABLE ONLY "public"."records"
    ADD CONSTRAINT "public_records_levelid_fkey" FOREIGN KEY ("levelid") REFERENCES "public"."levels"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."records"
    ADD CONSTRAINT "public_records_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."players"("uid") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "levels"."79484035" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable delete for users based on user_id" ON "public"."records" FOR DELETE USING ((("auth"."uid"() = "userid") AND ("isChecked" = false)));

CREATE POLICY "Enable read access for all users" ON "public"."achievement" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."levels" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."players" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."playersAchievement" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."records" FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on uid" ON "public"."players" FOR INSERT WITH CHECK (("auth"."uid"() = "uid"));

ALTER TABLE "public"."achievement" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."levels" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."playersAchievement" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."records" ENABLE ROW LEVEL SECURITY;

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."updateList"() TO "anon";
GRANT ALL ON FUNCTION "public"."updateList"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."updateList"() TO "service_role";

GRANT ALL ON FUNCTION "public"."updateRank"() TO "anon";
GRANT ALL ON FUNCTION "public"."updateRank"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."updateRank"() TO "service_role";

GRANT ALL ON TABLE "public"."achievement" TO "anon";
GRANT ALL ON TABLE "public"."achievement" TO "authenticated";
GRANT ALL ON TABLE "public"."achievement" TO "service_role";

GRANT ALL ON SEQUENCE "public"."achievement_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."achievement_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."achievement_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."levels" TO "anon";
GRANT ALL ON TABLE "public"."levels" TO "authenticated";
GRANT ALL ON TABLE "public"."levels" TO "service_role";

GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";

GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";

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

GRANT ALL ON TABLE "public"."records" TO "anon";
GRANT ALL ON TABLE "public"."records" TO "authenticated";
GRANT ALL ON TABLE "public"."records" TO "service_role";

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

RESET ALL;

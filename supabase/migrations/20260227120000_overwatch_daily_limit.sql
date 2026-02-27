ALTER TABLE "public"."players"
ADD COLUMN IF NOT EXISTS "overwatchReviewCount" integer NOT NULL DEFAULT 0;

ALTER TABLE "public"."players"
ADD COLUMN IF NOT EXISTS "overwatchReviewDate" date;

CREATE OR REPLACE FUNCTION "public"."reset_overwatch_daily_limits"() RETURNS void
    LANGUAGE "plpgsql"
AS $$
BEGIN
    UPDATE "public"."players"
    SET "overwatchReviewCount" = 0,
        "overwatchReviewDate" = CURRENT_DATE;
END;
$$;

ALTER FUNCTION "public"."reset_overwatch_daily_limits"() OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."reset_overwatch_daily_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_overwatch_daily_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_overwatch_daily_limits"() TO "service_role";
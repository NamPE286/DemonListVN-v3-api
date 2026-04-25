ALTER TABLE "public"."players"
    ADD COLUMN IF NOT EXISTS "overwatchOfficialReviewCount" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "overwatchNonOfficialReviewCount" integer DEFAULT 0 NOT NULL;

CREATE OR REPLACE FUNCTION "public"."reset_overwatch_daily_limits"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE "public"."players"
    SET "overwatchReviewCount" = 0,
        "overwatchOfficialReviewCount" = 0,
        "overwatchNonOfficialReviewCount" = 0,
        "overwatchReviewDate" = CURRENT_DATE;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."calculate_record_queue_no"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM set_config('statement_timeout', '10min', true);

    UPDATE "public"."records"
    SET "queueNo" = NULL
    WHERE "queueNo" IS NOT NULL;

    WITH "RankedRecords" AS (
        SELECT
            r."id",
            ROW_NUMBER() OVER (
                ORDER BY
                    CASE
                        WHEN p."supporterUntil" IS NOT NULL AND p."supporterUntil" > NOW()
                            THEN (r."timestamp" - 2592000000)::bigint - r."prioritizedBy"
                        ELSE r."timestamp" - r."prioritizedBy"
                    END,
                    r."timestamp",
                    r."id"
            ) AS "queueNo"
        FROM "public"."records" r
        JOIN "public"."players" p ON r."userid" = p."uid"
        WHERE COALESCE(r."acceptedManually", false) = false
            AND r."acceptedAuto" = false
            AND r."needMod" = false
            AND r."reviewer" IS NULL
    )
    UPDATE "public"."records" r
    SET "queueNo" = "RankedRecords"."queueNo"
    FROM "RankedRecords"
    WHERE r."id" = "RankedRecords"."id";
END;
$$;

ALTER FUNCTION "public"."calculate_record_queue_no"() OWNER TO "postgres";

COMMENT ON FUNCTION "public"."calculate_record_queue_no"() IS 'Calculates moderation queue numbers for pending records. Extracted from deprecated update_rank().';
COMMENT ON FUNCTION "public"."update_rank"() IS 'Deprecated: legacy global rank recalculation. Use list leaderboard refreshes for list rankings and calculate_record_queue_no() for pending record queue numbers.';
COMMENT ON FUNCTION "public"."update_list"() IS 'Deprecated: legacy list recalculation. Use the lists and listLevels system instead.';

GRANT ALL ON FUNCTION "public"."calculate_record_queue_no"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_record_queue_no"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_record_queue_no"() TO "service_role";
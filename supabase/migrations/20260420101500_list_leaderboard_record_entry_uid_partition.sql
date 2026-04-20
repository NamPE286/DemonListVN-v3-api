ALTER TABLE ONLY "public"."listLeaderboardRecordEntries"
    DROP CONSTRAINT IF EXISTS "list_leaderboard_record_entries_list_id_no_key";


DROP INDEX IF EXISTS "public"."list_leaderboard_record_entries_list_id_no_idx";


WITH "repartitioned_entries" AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "listId", "uid"
            ORDER BY "no" ASC, "id" ASC
        ) AS "nextNo"
    FROM "public"."listLeaderboardRecordEntries"
)
UPDATE "public"."listLeaderboardRecordEntries" AS "entries"
SET "no" = "repartitioned_entries"."nextNo"
FROM "repartitioned_entries"
WHERE "entries"."id" = "repartitioned_entries"."id";


ALTER TABLE ONLY "public"."listLeaderboardRecordEntries"
    ADD CONSTRAINT "list_leaderboard_record_entries_list_id_uid_no_key" UNIQUE ("listId", "uid", "no");


CREATE INDEX "list_leaderboard_record_entries_list_id_uid_no_idx"
    ON "public"."listLeaderboardRecordEntries" USING "btree" ("listId", "uid", "no");
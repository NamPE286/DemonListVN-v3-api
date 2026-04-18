ALTER TABLE "public"."listLevels"
    DROP CONSTRAINT IF EXISTS "listLevels_minProgress_check";

ALTER TABLE "public"."listLevels"
    ADD CONSTRAINT "listLevels_minProgress_check" CHECK ("minProgress" IS NULL OR "minProgress" >= 0);
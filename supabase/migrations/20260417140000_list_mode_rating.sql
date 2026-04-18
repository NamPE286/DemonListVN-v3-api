-- Add mode column to lists table
ALTER TABLE "public"."lists"
    ADD COLUMN "mode" text NOT NULL DEFAULT 'rating';

ALTER TABLE "public"."lists"
    ADD CONSTRAINT "lists_mode_check" CHECK ("mode" = ANY (ARRAY['rating'::text, 'top'::text]));

-- Add rating and position columns to listLevels table
ALTER TABLE "public"."listLevels"
    ADD COLUMN "rating" integer NOT NULL DEFAULT 5;

ALTER TABLE "public"."listLevels"
    ADD COLUMN "position" integer;

ALTER TABLE "public"."listLevels"
    ADD CONSTRAINT "listLevels_rating_check" CHECK ("rating" >= 1 AND "rating" <= 10);

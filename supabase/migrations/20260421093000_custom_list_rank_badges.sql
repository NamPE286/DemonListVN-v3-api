ALTER TABLE "public"."lists"
    ADD COLUMN IF NOT EXISTS "rankBadges" jsonb DEFAULT '[]'::jsonb NOT NULL;
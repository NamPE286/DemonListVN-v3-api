ALTER TABLE "public"."lists"
    ADD COLUMN IF NOT EXISTS "communityEnabled" boolean DEFAULT true NOT NULL;
-- Add isMirror flag to lists. Mirror lists are external lists whose levels are
-- crawled from another source rather than maintained directly by the owner.
ALTER TABLE "public"."lists"
    ADD COLUMN IF NOT EXISTS "isMirror" boolean NOT NULL DEFAULT false;

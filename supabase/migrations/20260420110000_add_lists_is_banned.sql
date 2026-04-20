ALTER TABLE "public"."lists"
ADD COLUMN IF NOT EXISTS "isBanned" boolean DEFAULT false NOT NULL;
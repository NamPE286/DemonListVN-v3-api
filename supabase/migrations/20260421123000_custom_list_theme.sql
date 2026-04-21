ALTER TABLE "public"."lists"
    ADD COLUMN IF NOT EXISTS "backgroundColor" "text",
    ADD COLUMN IF NOT EXISTS "bannerUrl" "text",
    ADD COLUMN IF NOT EXISTS "borderColor" "text",
    ADD COLUMN IF NOT EXISTS "logoUrl" "text";
ALTER TABLE "public"."players"
    ADD COLUMN IF NOT EXISTS "nameFts" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', COALESCE("name", ''::text)), 'A'::"char")
    ) STORED;

CREATE INDEX IF NOT EXISTS "players_name_fts_idx" ON "public"."players" USING GIN ("nameFts");

ALTER TABLE "public"."levels"
    ADD COLUMN IF NOT EXISTS "nameFts" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', COALESCE("name", ''::text)), 'A'::"char")
    ) STORED,
    ADD COLUMN IF NOT EXISTS "creatorFts" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', COALESCE("creator", ''::text)), 'A'::"char")
    ) STORED;

CREATE INDEX IF NOT EXISTS "levels_name_fts_idx" ON "public"."levels" USING GIN ("nameFts");
CREATE INDEX IF NOT EXISTS "levels_creator_fts_idx" ON "public"."levels" USING GIN ("creatorFts");

ALTER TABLE "public"."lists"
    ADD COLUMN IF NOT EXISTS "fts" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', COALESCE("title", ''::text)), 'A'::"char")
        || setweight(to_tsvector('simple', COALESCE("description", ''::text)), 'B'::"char")
    ) STORED;

CREATE INDEX IF NOT EXISTS "lists_fts_idx" ON "public"."lists" USING GIN ("fts");

ALTER TABLE "public"."communityComments"
    ADD COLUMN IF NOT EXISTS "fts" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', COALESCE("content", ''::text)), 'A'::"char")
    ) STORED;

CREATE INDEX IF NOT EXISTS "community_comments_fts_idx" ON "public"."communityComments" USING GIN ("fts");

ALTER TABLE "public"."events"
    ADD COLUMN IF NOT EXISTS "titleFts" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', COALESCE("title", ''::text)), 'A'::"char")
    ) STORED;

CREATE INDEX IF NOT EXISTS "events_title_fts_idx" ON "public"."events" USING GIN ("titleFts");

ALTER TABLE "public"."items"
    ADD COLUMN IF NOT EXISTS "nameFts" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', COALESCE("name", ''::text)), 'A'::"char")
    ) STORED;

CREATE INDEX IF NOT EXISTS "items_name_fts_idx" ON "public"."items" USING GIN ("nameFts");

ALTER TABLE "public"."clans"
    ADD COLUMN IF NOT EXISTS "nameFts" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', COALESCE("name", ''::text)), 'A'::"char")
    ) STORED;

CREATE INDEX IF NOT EXISTS "clans_name_fts_idx" ON "public"."clans" USING GIN ("nameFts");

ALTER TABLE "public"."orders"
    ADD COLUMN IF NOT EXISTS "recipientNameFts" tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', COALESCE("recipientName", ''::text)), 'A'::"char")
    ) STORED;

CREATE INDEX IF NOT EXISTS "orders_recipient_name_fts_idx" ON "public"."orders" USING GIN ("recipientNameFts");

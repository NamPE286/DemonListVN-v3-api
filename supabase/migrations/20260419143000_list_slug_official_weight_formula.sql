ALTER TABLE "public"."lists"
    ADD COLUMN "slug" text,
    ADD COLUMN "isOfficial" boolean NOT NULL DEFAULT false,
    ADD COLUMN "weightFormula" text NOT NULL DEFAULT '1';

ALTER TABLE "public"."lists"
    ADD CONSTRAINT "lists_slug_check" CHECK (
        "slug" IS NULL
        OR (
            length("slug") >= 1
            AND length("slug") <= 100
            AND "slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        )
    );

ALTER TABLE "public"."lists"
    ADD CONSTRAINT "lists_weight_formula_check" CHECK (length("weightFormula") >= 1 AND length("weightFormula") <= 500);

CREATE UNIQUE INDEX IF NOT EXISTS "lists_slug_key" ON "public"."lists" USING btree ("slug") WHERE ("slug" IS NOT NULL);
CREATE INDEX IF NOT EXISTS "lists_is_official_idx" ON "public"."lists" USING btree ("isOfficial", "updated_at" DESC);

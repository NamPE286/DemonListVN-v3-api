ALTER TABLE public."listLevels"
    ADD COLUMN IF NOT EXISTS "accepted" boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "submissionComment" text;

UPDATE public."listLevels"
SET "accepted" = true
WHERE "accepted" IS NULL;

CREATE INDEX IF NOT EXISTS "list_levels_list_id_accepted_created_at_idx"
    ON public."listLevels" USING btree ("listId", "accepted", "created_at");
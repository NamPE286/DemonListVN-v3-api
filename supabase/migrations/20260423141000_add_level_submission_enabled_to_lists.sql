ALTER TABLE public."lists"
    ADD COLUMN IF NOT EXISTS "levelSubmissionEnabled" boolean NOT NULL DEFAULT false;

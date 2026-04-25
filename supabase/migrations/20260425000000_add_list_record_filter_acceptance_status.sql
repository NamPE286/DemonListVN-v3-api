DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'lists'
            AND column_name = 'recordFilterAcceptanceStatus'
    ) THEN
        ALTER TABLE "public"."lists"
            ADD COLUMN "recordFilterAcceptanceStatus" text DEFAULT 'manual'::text NOT NULL;

        UPDATE "public"."lists"
        SET "recordFilterAcceptanceStatus" = CASE
            WHEN "recordFilterManualAcceptanceOnly" THEN 'manual'
            ELSE 'any'
        END;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'lists_recordFilterAcceptanceStatus_check'
    ) THEN
        ALTER TABLE "public"."lists"
            ADD CONSTRAINT "lists_recordFilterAcceptanceStatus_check"
            CHECK ("recordFilterAcceptanceStatus" = ANY (ARRAY['manual'::text, 'auto'::text, 'any'::text]));
    END IF;
END $$;

ALTER TABLE "public"."lists"
    ADD COLUMN "isPlatformer" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."listLevels"
    ADD COLUMN "minProgress" integer;

ALTER TABLE "public"."listLevels"
    ADD CONSTRAINT "listLevels_minProgress_check" CHECK ("minProgress" IS NULL OR "minProgress" > 0);

CREATE OR REPLACE FUNCTION "public"."assert_custom_list_level_platformer_match"(
    "p_list_id" bigint,
    "p_level_id" bigint
) RETURNS void
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    list_is_platformer boolean;
    level_is_platformer boolean;
BEGIN
    SELECT "isPlatformer"
    INTO list_is_platformer
    FROM public."lists"
    WHERE "id" = "p_list_id";

    IF list_is_platformer IS NULL THEN
        RAISE EXCEPTION 'Custom list % does not exist', "p_list_id";
    END IF;

    SELECT "isPlatformer"
    INTO level_is_platformer
    FROM public."levels"
    WHERE "id" = "p_level_id";

    IF level_is_platformer IS NULL THEN
        RAISE EXCEPTION 'Level % does not exist', "p_level_id";
    END IF;

    IF list_is_platformer <> level_is_platformer THEN
        RAISE EXCEPTION 'Platformer levels can only be added to platformer lists and classic levels can only be added to classic lists';
    END IF;
END;
$$;

ALTER FUNCTION "public"."assert_custom_list_level_platformer_match"(bigint, bigint) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."validate_custom_list_level_platformer_match"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM public."assert_custom_list_level_platformer_match"(NEW."listId", NEW."levelId");
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."validate_custom_list_level_platformer_match"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."validate_custom_list_platformer_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW."isPlatformer" IS DISTINCT FROM OLD."isPlatformer"
        AND EXISTS (
            SELECT 1
            FROM public."listLevels" AS "listLevels"
            INNER JOIN public."levels" AS "levels"
                ON "levels"."id" = "listLevels"."levelId"
            WHERE "listLevels"."listId" = NEW."id"
                AND COALESCE("levels"."isPlatformer", false) <> NEW."isPlatformer"
        ) THEN
        RAISE EXCEPTION 'Cannot change custom list % to %, because it already contains levels of the opposite type',
            NEW."id",
            CASE WHEN NEW."isPlatformer" THEN 'platformer' ELSE 'classic' END;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."validate_custom_list_platformer_update"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."validate_level_platformer_custom_lists"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW."isPlatformer" IS DISTINCT FROM OLD."isPlatformer"
        AND EXISTS (
            SELECT 1
            FROM public."listLevels" AS "listLevels"
            INNER JOIN public."lists" AS "lists"
                ON "lists"."id" = "listLevels"."listId"
            WHERE "listLevels"."levelId" = NEW."id"
                AND COALESCE("lists"."isPlatformer", false) <> NEW."isPlatformer"
        ) THEN
        RAISE EXCEPTION 'Cannot change level % to %, because it already belongs to custom lists of the opposite type',
            NEW."id",
            CASE WHEN NEW."isPlatformer" THEN 'platformer' ELSE 'classic' END;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."validate_level_platformer_custom_lists"() OWNER TO "postgres";

CREATE TRIGGER "validate_custom_list_level_platformer_match"
    BEFORE INSERT OR UPDATE OF "listId", "levelId"
    ON "public"."listLevels"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."validate_custom_list_level_platformer_match"();

CREATE TRIGGER "validate_custom_list_platformer_update"
    BEFORE UPDATE OF "isPlatformer"
    ON "public"."lists"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."validate_custom_list_platformer_update"();

CREATE TRIGGER "validate_level_platformer_custom_lists"
    BEFORE UPDATE OF "isPlatformer"
    ON "public"."levels"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."validate_level_platformer_custom_lists"();

UPDATE "public"."lists" AS "lists"
SET "isPlatformer" = true
WHERE EXISTS (
    SELECT 1
    FROM "public"."listLevels" AS "listLevels"
    INNER JOIN "public"."levels" AS "levels"
        ON "levels"."id" = "listLevels"."levelId"
    WHERE "listLevels"."listId" = "lists"."id"
)
AND NOT EXISTS (
    SELECT 1
    FROM "public"."listLevels" AS "listLevels"
    INNER JOIN "public"."levels" AS "levels"
        ON "levels"."id" = "listLevels"."levelId"
    WHERE "listLevels"."listId" = "lists"."id"
        AND COALESCE("levels"."isPlatformer", false) = false
);
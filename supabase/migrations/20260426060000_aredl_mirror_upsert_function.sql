CREATE OR REPLACE FUNCTION "public"."upsert_aredl_mirror_list"(
    "p_list_id" bigint,
    "p_actor_uid" uuid,
    "p_actor_is_moderator" boolean DEFAULT false,
    "p_levels" jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    "v_list" public."lists"%ROWTYPE;
    "v_actor_role" text;
    "v_processed" integer := 0;
    "v_inserted" integer := 0;
    "v_updated" integer := 0;
    "v_unchanged" integer := 0;
    "v_failed" integer := 0;
    "v_removed" integer := 0;
    "v_level_count" integer := 0;
    "v_source_level_ids" jsonb := '[]'::jsonb;
    "v_failures" jsonb := '[]'::jsonb;
    "v_list_json" jsonb := '{}'::jsonb;
BEGIN
    IF "p_list_id" <> 114 THEN
        RAISE EXCEPTION 'AREDL crawler is configured for list #114';
    END IF;

    IF "p_actor_uid" IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF "p_levels" IS NULL OR jsonb_typeof("p_levels") <> 'array' THEN
        RAISE EXCEPTION 'AREDL levels payload must be an array';
    END IF;

    SELECT *
    INTO "v_list"
    FROM public."lists"
    WHERE "id" = "p_list_id";

    IF NOT FOUND THEN
        RAISE EXCEPTION 'List not found';
    END IF;

    IF NOT "v_list"."isMirror" THEN
        RAISE EXCEPTION 'Mirror crawler is only available for mirror lists';
    END IF;

    IF "v_list"."isPlatformer" THEN
        RAISE EXCEPTION 'AREDL mirror list must be a classic list';
    END IF;

    IF "v_list"."mode" <> 'top' THEN
        RAISE EXCEPTION 'AREDL mirror list must use top mode';
    END IF;

    IF NOT COALESCE("p_actor_is_moderator", false) THEN
        IF "v_list"."isBanned" THEN
            RAISE EXCEPTION 'This list has been banned and cannot be edited';
        END IF;

        IF "v_list"."owner" <> "p_actor_uid" THEN
            SELECT "role"
            INTO "v_actor_role"
            FROM public."listMembers"
            WHERE "listId" = "p_list_id"
                AND "uid" = "p_actor_uid"
            LIMIT 1;

            IF COALESCE("v_actor_role", '') NOT IN ('admin', 'helper') THEN
                RAISE EXCEPTION 'You do not have permission to modify levels on this list';
            END IF;
        END IF;
    END IF;

    CREATE TEMP TABLE IF NOT EXISTS "aredl_mirror_source" (
        "level_id" bigint PRIMARY KEY,
        "position" integer NOT NULL,
        "points" integer NOT NULL,
        "name" text NOT NULL,
        "source_order" bigint NOT NULL
    ) ON COMMIT DROP;

    CREATE TEMP TABLE IF NOT EXISTS "aredl_mirror_existing" (
        "id" bigint PRIMARY KEY,
        "levelId" bigint NOT NULL,
        "addedBy" uuid NOT NULL,
        "accepted" boolean NOT NULL,
        "position" integer,
        "minProgress" integer,
        "videoID" text,
        "rating" integer NOT NULL
    ) ON COMMIT DROP;

    CREATE TEMP TABLE IF NOT EXISTS "aredl_mirror_failures" (
        "level_id" bigint PRIMARY KEY,
        "position" integer NOT NULL,
        "name" text NOT NULL,
        "error" text NOT NULL
    ) ON COMMIT DROP;

    TRUNCATE TABLE "aredl_mirror_source";
    TRUNCATE TABLE "aredl_mirror_existing";
    TRUNCATE TABLE "aredl_mirror_failures";

    WITH "normalized" AS (
        SELECT
            CASE
                WHEN ("entry"."value" ->> 'level_id') ~ '^\d+$'
                    THEN ("entry"."value" ->> 'level_id')::bigint
                ELSE NULL
            END AS "level_id",
            CASE
                WHEN ("entry"."value" ->> 'position') ~ '^\d+$'
                    THEN ("entry"."value" ->> 'position')::integer
                ELSE NULL
            END AS "position",
            CASE
                WHEN ("entry"."value" ->> 'points') ~ '^\d+$'
                    THEN ("entry"."value" ->> 'points')::integer
                ELSE NULL
            END AS "points",
            NULLIF(BTRIM("entry"."value" ->> 'name'), '') AS "name",
            "entry"."ordinality" AS "source_order"
        FROM jsonb_array_elements("p_levels") WITH ORDINALITY AS "entry"("value", "ordinality")
    ), "valid" AS (
        SELECT
            "level_id",
            "position",
            "points",
            COALESCE("name", 'AREDL level #' || "level_id"::text) AS "name",
            "source_order"
        FROM "normalized"
        WHERE "level_id" IS NOT NULL
            AND "level_id" > 0
            AND "position" IS NOT NULL
            AND "position" > 0
            AND "points" IS NOT NULL
            AND "points" >= 0
    )
    INSERT INTO "aredl_mirror_source" ("level_id", "position", "points", "name", "source_order")
    SELECT DISTINCT ON ("level_id")
        "level_id",
        "position",
        "points",
        "name",
        "source_order"
    FROM "valid"
    ORDER BY "level_id", "source_order";

    SELECT COUNT(*) INTO "v_processed" FROM "aredl_mirror_source";

    IF "v_processed" = 0 THEN
        RAISE EXCEPTION 'AREDL levels response must not be empty';
    END IF;

    INSERT INTO public."levels" ("id", "name", "isPlatformer")
    SELECT "level_id", "name", false
    FROM "aredl_mirror_source"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "aredl_mirror_failures" ("level_id", "position", "name", "error")
    SELECT
        "source"."level_id",
        "source"."position",
        "source"."name",
        'This level cannot be added to this list type'
    FROM "aredl_mirror_source" AS "source"
    INNER JOIN public."levels" AS "levels"
        ON "levels"."id" = "source"."level_id"
    WHERE "levels"."isPlatformer" IS DISTINCT FROM false;

    SELECT COUNT(*) INTO "v_failed" FROM "aredl_mirror_failures";

    INSERT INTO "aredl_mirror_existing" (
        "id",
        "levelId",
        "addedBy",
        "accepted",
        "position",
        "minProgress",
        "videoID",
        "rating"
    )
    SELECT
        "item"."id",
        "item"."levelId",
        "item"."addedBy",
        "item"."accepted",
        "item"."position",
        "item"."minProgress",
        "item"."videoID",
        "item"."rating"
    FROM public."listLevels" AS "item"
    INNER JOIN "aredl_mirror_source" AS "source"
        ON "source"."level_id" = "item"."levelId"
    WHERE "item"."listId" = "p_list_id";

    SELECT COUNT(*)
    INTO "v_inserted"
    FROM "aredl_mirror_source" AS "source"
    LEFT JOIN "aredl_mirror_existing" AS "existing"
        ON "existing"."levelId" = "source"."level_id"
    LEFT JOIN "aredl_mirror_failures" AS "failure"
        ON "failure"."level_id" = "source"."level_id"
    WHERE "failure"."level_id" IS NULL
        AND "existing"."id" IS NULL;

    SELECT COUNT(*)
    INTO "v_updated"
    FROM "aredl_mirror_source" AS "source"
    INNER JOIN "aredl_mirror_existing" AS "existing"
        ON "existing"."levelId" = "source"."level_id"
    LEFT JOIN "aredl_mirror_failures" AS "failure"
        ON "failure"."level_id" = "source"."level_id"
    WHERE "failure"."level_id" IS NULL
        AND (
            "existing"."accepted" IS DISTINCT FROM true
            OR "existing"."position" IS DISTINCT FROM "source"."position"
            OR "existing"."rating" IS DISTINCT FROM "source"."points"
        );

    SELECT COUNT(*)
    INTO "v_unchanged"
    FROM "aredl_mirror_source" AS "source"
    INNER JOIN "aredl_mirror_existing" AS "existing"
        ON "existing"."levelId" = "source"."level_id"
    LEFT JOIN "aredl_mirror_failures" AS "failure"
        ON "failure"."level_id" = "source"."level_id"
    WHERE "failure"."level_id" IS NULL
        AND "existing"."accepted" IS NOT DISTINCT FROM true
        AND "existing"."position" IS NOT DISTINCT FROM "source"."position"
        AND "existing"."rating" IS NOT DISTINCT FROM "source"."points";

    INSERT INTO public."listLevels" (
        "listId",
        "levelId",
        "addedBy",
        "accepted",
        "position",
        "minProgress",
        "videoID",
        "rating"
    )
    SELECT
        "p_list_id",
        "source"."level_id",
        COALESCE("existing"."addedBy", "p_actor_uid"),
        true,
        "source"."position",
        "existing"."minProgress",
        "existing"."videoID",
        "source"."points"
    FROM "aredl_mirror_source" AS "source"
    LEFT JOIN "aredl_mirror_existing" AS "existing"
        ON "existing"."levelId" = "source"."level_id"
    LEFT JOIN "aredl_mirror_failures" AS "failure"
        ON "failure"."level_id" = "source"."level_id"
    WHERE "failure"."level_id" IS NULL
    ON CONFLICT ("listId", "levelId") DO UPDATE
    SET
        "accepted" = EXCLUDED."accepted",
        "position" = EXCLUDED."position",
        "rating" = EXCLUDED."rating"
    WHERE public."listLevels"."accepted" IS DISTINCT FROM EXCLUDED."accepted"
        OR public."listLevels"."position" IS DISTINCT FROM EXCLUDED."position"
        OR public."listLevels"."rating" IS DISTINCT FROM EXCLUDED."rating";

    WITH "deleted" AS (
        DELETE FROM public."listLevels" AS "item"
        WHERE "item"."listId" = "p_list_id"
            AND "item"."accepted" = true
            AND NOT EXISTS (
                SELECT 1
                FROM "aredl_mirror_source" AS "source"
                WHERE "source"."level_id" = "item"."levelId"
            )
        RETURNING 1
    )
    SELECT COUNT(*) INTO "v_removed" FROM "deleted";

    SELECT COUNT(*)
    INTO "v_level_count"
    FROM public."listLevels"
    WHERE "listId" = "p_list_id"
        AND "accepted" = true;

    UPDATE public."lists" AS "list"
    SET
        "levelCount" = "v_level_count",
        "updated_at" = now()
    WHERE "list"."id" = "p_list_id"
    RETURNING to_jsonb("list") INTO "v_list_json";

    SELECT COALESCE(jsonb_agg("level_id" ORDER BY "position"), '[]'::jsonb)
    INTO "v_source_level_ids"
    FROM "aredl_mirror_source";

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'levelId', "level_id",
                'position', "position",
                'name', "name",
                'error', "error"
            )
            ORDER BY "position"
        ),
        '[]'::jsonb
    )
    INTO "v_failures"
    FROM "aredl_mirror_failures";

    INSERT INTO public."listAuditLogs" ("listId", "actorUid", "action", "metadata")
    VALUES (
        "p_list_id",
        "p_actor_uid",
        'aredl_mirror_crawled',
        jsonb_build_object(
            'source', 'aredl',
            'mirrorListId', 114,
            'sourceLevelCount', "v_processed",
            'processed', "v_processed",
            'inserted', "v_inserted",
            'updated', "v_updated",
            'unchanged', "v_unchanged",
            'failed', "v_failed",
            'removed', "v_removed"
        )
    );

    RETURN jsonb_build_object(
        'processed', "v_processed",
        'inserted', "v_inserted",
        'updated', "v_updated",
        'unchanged', "v_unchanged",
        'failed', "v_failed",
        'removed', "v_removed",
        'sourceLevelCount', "v_processed",
        'sourceLevelIds', "v_source_level_ids",
        'failures', "v_failures",
        'list', "v_list_json"
    );
END;
$$;

REVOKE ALL ON FUNCTION "public"."upsert_aredl_mirror_list"(bigint, uuid, boolean, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."upsert_aredl_mirror_list"(bigint, uuid, boolean, jsonb) TO "service_role";
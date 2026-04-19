DO $$
DECLARE
    seed_owner constant uuid := '3e788ac1-989c-4d2b-bfaf-f99059d258cf';
    dl_list_id bigint;
    pl_list_id bigint;
    fl_list_id bigint;
    cl_list_id bigint;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public."players"
        WHERE "uid" = seed_owner
    ) THEN
        RAISE NOTICE 'Skipping official list data migration because owner % does not exist in players.', seed_owner;
        RETURN;
    END IF;

    SELECT "id" INTO dl_list_id FROM public."lists" WHERE "slug" = 'dl' LIMIT 1;
    IF dl_list_id IS NULL THEN
        INSERT INTO public."lists" (
            "owner",
            "title",
            "description",
            "visibility",
            "tags",
            "levelCount",
            "isPlatformer",
            "communityEnabled",
            "mode",
            "slug",
            "isOfficial",
            "weightFormula",
            "created_at",
            "updated_at"
        )
        VALUES (
            seed_owner,
            'Classic List',
            'Official Geometry Dash Việt Nam classic demon list.',
            'public',
            ARRAY['official', 'classic']::text[],
            0,
            false,
            false,
            'rating',
            'dl',
            true,
            '1',
            now(),
            now()
        )
        RETURNING "id" INTO dl_list_id;
    ELSE
        UPDATE public."lists"
        SET
            "owner" = seed_owner,
            "title" = 'Classic List',
            "description" = 'Official Geometry Dash Việt Nam classic demon list.',
            "visibility" = 'public',
            "tags" = ARRAY['official', 'classic']::text[],
            "isPlatformer" = false,
            "communityEnabled" = false,
            "mode" = 'rating',
            "slug" = 'dl',
            "isOfficial" = true,
            "weightFormula" = '1',
            "updated_at" = now()
        WHERE "id" = dl_list_id;
    END IF;

    SELECT "id" INTO pl_list_id FROM public."lists" WHERE "slug" = 'pl' LIMIT 1;
    IF pl_list_id IS NULL THEN
        INSERT INTO public."lists" (
            "owner",
            "title",
            "description",
            "visibility",
            "tags",
            "levelCount",
            "isPlatformer",
            "communityEnabled",
            "mode",
            "slug",
            "isOfficial",
            "weightFormula",
            "created_at",
            "updated_at"
        )
        VALUES (
            seed_owner,
            'Platformer List',
            'Official Geometry Dash Việt Nam platformer list.',
            'public',
            ARRAY['official', 'platformer']::text[],
            0,
            true,
            false,
            'top',
            'pl',
            true,
            '1',
            now(),
            now()
        )
        RETURNING "id" INTO pl_list_id;
    ELSE
        UPDATE public."lists"
        SET
            "owner" = seed_owner,
            "title" = 'Platformer List',
            "description" = 'Official Geometry Dash Việt Nam platformer list.',
            "visibility" = 'public',
            "tags" = ARRAY['official', 'platformer']::text[],
            "isPlatformer" = true,
            "communityEnabled" = false,
            "mode" = 'top',
            "slug" = 'pl',
            "isOfficial" = true,
            "weightFormula" = '1',
            "updated_at" = now()
        WHERE "id" = pl_list_id;
    END IF;

    SELECT "id" INTO fl_list_id FROM public."lists" WHERE "slug" = 'fl' LIMIT 1;
    IF fl_list_id IS NULL THEN
        INSERT INTO public."lists" (
            "owner",
            "title",
            "description",
            "visibility",
            "tags",
            "levelCount",
            "isPlatformer",
            "communityEnabled",
            "mode",
            "slug",
            "isOfficial",
            "weightFormula",
            "created_at",
            "updated_at"
        )
        VALUES (
            seed_owner,
            'Featured List',
            'Official Geometry Dash Việt Nam featured list.',
            'public',
            ARRAY['official', 'featured']::text[],
            0,
            false,
            false,
            'top',
            'fl',
            true,
            '1',
            now(),
            now()
        )
        RETURNING "id" INTO fl_list_id;
    ELSE
        UPDATE public."lists"
        SET
            "owner" = seed_owner,
            "title" = 'Featured List',
            "description" = 'Official Geometry Dash Việt Nam featured list.',
            "visibility" = 'public',
            "tags" = ARRAY['official', 'featured']::text[],
            "isPlatformer" = false,
            "communityEnabled" = false,
            "mode" = 'top',
            "slug" = 'fl',
            "isOfficial" = true,
            "weightFormula" = '1',
            "updated_at" = now()
        WHERE "id" = fl_list_id;
    END IF;

    SELECT "id" INTO cl_list_id FROM public."lists" WHERE "slug" = 'cl' LIMIT 1;
    IF cl_list_id IS NULL THEN
        INSERT INTO public."lists" (
            "owner",
            "title",
            "description",
            "visibility",
            "tags",
            "levelCount",
            "isPlatformer",
            "communityEnabled",
            "mode",
            "slug",
            "isOfficial",
            "weightFormula",
            "created_at",
            "updated_at"
        )
        VALUES (
            seed_owner,
            'Challenge List',
            'Official Geometry Dash Việt Nam challenge list.',
            'public',
            ARRAY['official', 'challenge']::text[],
            0,
            false,
            false,
            'rating',
            'cl',
            true,
            '1',
            now(),
            now()
        )
        RETURNING "id" INTO cl_list_id;
    ELSE
        UPDATE public."lists"
        SET
            "owner" = seed_owner,
            "title" = 'Challenge List',
            "description" = 'Official Geometry Dash Việt Nam challenge list.',
            "visibility" = 'public',
            "tags" = ARRAY['official', 'challenge']::text[],
            "isPlatformer" = false,
            "communityEnabled" = false,
            "mode" = 'rating',
            "slug" = 'cl',
            "isOfficial" = true,
            "weightFormula" = '1',
            "updated_at" = now()
        WHERE "id" = cl_list_id;
    END IF;

    INSERT INTO public."listLevels" (
        "listId",
        "levelId",
        "addedBy",
        "rating",
        "position",
        "minProgress",
        "created_at"
    )
    SELECT
        dl_list_id,
        source."id",
        seed_owner,
        source."rating",
        source."position",
        NULL,
        now()
    FROM (
        SELECT
            levels."id",
            LEAST(GREATEST(COALESCE(levels."rating", 5), 1), 10)::integer AS "rating",
            (ROW_NUMBER() OVER (ORDER BY levels."dlTop" ASC NULLS LAST, levels."id" ASC) - 1)::integer AS "position"
        FROM public."levels" AS levels
        WHERE levels."dlTop" IS NOT NULL
          AND COALESCE(levels."isPlatformer", false) = false
          AND COALESCE(levels."isChallenge", false) = false
          AND COALESCE(levels."isNonList", false) = false
    ) AS source
    ON CONFLICT ("listId", "levelId") DO UPDATE
    SET
        "addedBy" = EXCLUDED."addedBy",
        "rating" = EXCLUDED."rating",
        "position" = EXCLUDED."position",
        "minProgress" = EXCLUDED."minProgress";

    INSERT INTO public."listLevels" (
        "listId",
        "levelId",
        "addedBy",
        "rating",
        "position",
        "minProgress",
        "created_at"
    )
    SELECT
        pl_list_id,
        source."id",
        seed_owner,
        source."rating",
        source."position",
        NULL,
        now()
    FROM (
        SELECT
            levels."id",
            LEAST(GREATEST(COALESCE(levels."rating", 5), 1), 10)::integer AS "rating",
            (ROW_NUMBER() OVER (ORDER BY levels."dlTop" ASC NULLS LAST, levels."id" ASC) - 1)::integer AS "position"
        FROM public."levels" AS levels
        WHERE levels."dlTop" IS NOT NULL
          AND COALESCE(levels."isPlatformer", false) = true
          AND COALESCE(levels."isChallenge", false) = false
          AND COALESCE(levels."isNonList", false) = false
    ) AS source
    ON CONFLICT ("listId", "levelId") DO UPDATE
    SET
        "addedBy" = EXCLUDED."addedBy",
        "rating" = EXCLUDED."rating",
        "position" = EXCLUDED."position",
        "minProgress" = EXCLUDED."minProgress";

    INSERT INTO public."listLevels" (
        "listId",
        "levelId",
        "addedBy",
        "rating",
        "position",
        "minProgress",
        "created_at"
    )
    SELECT
        cl_list_id,
        source."id",
        seed_owner,
        source."rating",
        source."position",
        NULL,
        now()
    FROM (
        SELECT
            levels."id",
            LEAST(GREATEST(COALESCE(levels."rating", 5), 1), 10)::integer AS "rating",
            (ROW_NUMBER() OVER (ORDER BY levels."dlTop" ASC NULLS LAST, levels."id" ASC) - 1)::integer AS "position"
        FROM public."levels" AS levels
        WHERE levels."dlTop" IS NOT NULL
          AND COALESCE(levels."isChallenge", false) = true
          AND COALESCE(levels."isNonList", false) = false
    ) AS source
    ON CONFLICT ("listId", "levelId") DO UPDATE
    SET
        "addedBy" = EXCLUDED."addedBy",
        "rating" = EXCLUDED."rating",
        "position" = EXCLUDED."position",
        "minProgress" = EXCLUDED."minProgress";

    BEGIN
        EXECUTE 'ALTER TABLE public."listLevels" DISABLE TRIGGER "validate_custom_list_level_platformer_match"';

        INSERT INTO public."listLevels" (
            "listId",
            "levelId",
            "addedBy",
            "rating",
            "position",
            "minProgress",
            "created_at"
        )
        SELECT
            fl_list_id,
            source."id",
            seed_owner,
            source."rating",
            source."position",
            NULL,
            now()
        FROM (
            SELECT
                levels."id",
                LEAST(GREATEST(COALESCE(levels."rating", 5), 1), 10)::integer AS "rating",
                (ROW_NUMBER() OVER (ORDER BY levels."flTop" ASC NULLS LAST, levels."id" ASC) - 1)::integer AS "position"
            FROM public."levels" AS levels
            WHERE levels."flTop" IS NOT NULL
              AND COALESCE(levels."isNonList", false) = false
        ) AS source
        ON CONFLICT ("listId", "levelId") DO UPDATE
        SET
            "addedBy" = EXCLUDED."addedBy",
            "rating" = EXCLUDED."rating",
            "position" = EXCLUDED."position",
            "minProgress" = EXCLUDED."minProgress";

        EXECUTE 'ALTER TABLE public."listLevels" ENABLE TRIGGER "validate_custom_list_level_platformer_match"';
    EXCEPTION
        WHEN OTHERS THEN
            EXECUTE 'ALTER TABLE public."listLevels" ENABLE TRIGGER "validate_custom_list_level_platformer_match"';
            RAISE;
    END;

    UPDATE public."lists" AS lists
    SET
        "levelCount" = counts."levelCount",
        "updated_at" = now()
    FROM (
        SELECT
            "listId",
            COUNT(*)::bigint AS "levelCount"
        FROM public."listLevels"
        WHERE "listId" = ANY(ARRAY[dl_list_id, pl_list_id, fl_list_id, cl_list_id])
        GROUP BY "listId"
    ) AS counts
    WHERE lists."id" = counts."listId";

    UPDATE public."lists"
    SET
        "levelCount" = 0,
        "updated_at" = now()
    WHERE "id" = ANY(ARRAY[dl_list_id, pl_list_id, fl_list_id, cl_list_id])
      AND NOT EXISTS (
        SELECT 1
        FROM public."listLevels" AS ll
        WHERE ll."listId" = public."lists"."id"
    );

    RAISE NOTICE 'Official list data migration completed for dl=%, pl=%, fl=%, cl=%', dl_list_id, pl_list_id, fl_list_id, cl_list_id;
END;
$$;
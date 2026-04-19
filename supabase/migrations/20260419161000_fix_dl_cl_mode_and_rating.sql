-- Fix dl and cl lists: set mode to 'rating' and backfill listLevels.rating from levels.rating

UPDATE public."lists"
SET
    "mode" = 'rating',
    "updated_at" = now()
WHERE "slug" IN ('dl', 'cl')
  AND "isOfficial" = true;

-- dl: copy rating and minProgress from levels
UPDATE public."listLevels" AS ll
SET
    "rating" = LEAST(GREATEST(COALESCE(lv."rating", 5), 1), 10)::integer,
    "minProgress" = lv."minProgress"
FROM public."levels" AS lv,
     public."lists" AS ls
WHERE ll."levelId" = lv."id"
  AND ll."listId" = ls."id"
  AND ls."slug" = 'dl'
  AND ls."isOfficial" = true;

-- cl: copy rating from levels, set minProgress to 100
UPDATE public."listLevels" AS ll
SET
    "rating" = LEAST(GREATEST(COALESCE(lv."rating", 5), 1), 10)::integer,
    "minProgress" = 100
FROM public."levels" AS lv,
     public."lists" AS ls
WHERE ll."levelId" = lv."id"
  AND ll."listId" = ls."id"
  AND ls."slug" = 'cl'
  AND ls."isOfficial" = true;

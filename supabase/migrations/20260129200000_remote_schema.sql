create or replace view "public"."wikiTree" as  WITH exploded AS (
         SELECT wiki.path,
            string_to_array(wiki.path, '/'::text) AS parts
           FROM public.wiki
        ), levels AS (
         SELECT exploded.path,
            generate_series(1, array_length(exploded.parts, 1)) AS level,
            exploded.parts
           FROM exploded
        ), nodes AS (
         SELECT DISTINCT array_to_string(levels.parts[1:levels.level], '/'::text) AS path,
                CASE
                    WHEN (levels.level = array_length(levels.parts, 1)) THEN 'file'::text
                    ELSE 'folder'::text
                END AS type,
            array_to_string(levels.parts[1:(levels.level - 1)], '/'::text) AS parent,
            levels.level
           FROM levels
        )
 SELECT path,
    type,
    parent,
    level
   FROM nodes;




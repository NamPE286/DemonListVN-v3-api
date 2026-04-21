UPDATE "public"."lists"
SET "rankBadges" = jsonb_build_array(
    jsonb_build_object(
        'name', 'Ascended Grandmaster',
        'shorthand', 'AGM',
        'color', 'white;background: linear-gradient(to right, #ff00cc, #333399);',
        'minRating', NULL,
        'minTop', 1
    ),
    jsonb_build_object(
        'name', 'Legendary Grandmaster',
        'shorthand', 'LGM',
        'color', 'darkred',
        'minRating', NULL,
        'minTop', 5
    ),
    jsonb_build_object(
        'name', 'Grandmaster',
        'shorthand', 'GM',
        'color', 'red',
        'minRating', NULL,
        'minTop', 15
    ),
    jsonb_build_object(
        'name', 'Master',
        'shorthand', 'M',
        'color', 'hsla(321, 100%, 50%, 1)',
        'minRating', 3500,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'Candidate Master',
        'shorthand', 'CM',
        'color', 'purple',
        'minRating', 2500,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'Expert',
        'shorthand', 'EX',
        'color', 'blue',
        'minRating', 2000,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'Specialist',
        'shorthand', 'SP',
        'color', 'darkcyan',
        'minRating', 1500,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'A',
        'shorthand', 'A',
        'color', 'green',
        'minRating', 1000,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'B',
        'shorthand', 'B',
        'color', '#413cde',
        'minRating', 500,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'C',
        'shorthand', 'C',
        'color', 'gray',
        'minRating', 0.001,
        'minTop', NULL
    )
)
WHERE "slug" = 'dl'
  AND "isOfficial" = TRUE;

UPDATE "public"."lists"
SET "rankBadges" = jsonb_build_array(
    jsonb_build_object(
        'name', 'Challenger V',
        'shorthand', 'V',
        'color', 'darkred',
        'minRating', NULL,
        'minTop', 5
    ),
    jsonb_build_object(
        'name', 'Challenger IV',
        'shorthand', 'IV',
        'color', 'red',
        'minRating', NULL,
        'minTop', 15
    ),
    jsonb_build_object(
        'name', 'Challenger III',
        'shorthand', 'III',
        'color', 'hsla(321, 100%, 50%, 1)',
        'minRating', 2500,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'Challenger II',
        'shorthand', 'II',
        'color', 'purple',
        'minRating', 2000,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'Challenger I',
        'shorthand', 'I',
        'color', 'blue',
        'minRating', 1500,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'S',
        'shorthand', 'S',
        'color', 'gold',
        'minRating', 1000,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'A',
        'shorthand', 'A',
        'color', '#413cde',
        'minRating', 600,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'B',
        'shorthand', 'B',
        'color', 'gray',
        'minRating', 300,
        'minTop', NULL
    ),
    jsonb_build_object(
        'name', 'C',
        'shorthand', 'C',
        'color', 'gray',
        'minRating', 0.001,
        'minTop', NULL
    )
)
WHERE "slug" = 'cl'
  AND "isOfficial" = TRUE;
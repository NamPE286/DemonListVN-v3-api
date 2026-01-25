alter table "public"."battlePassLevels" alter column "minProgress" set default '100'::bigint;

alter table "public"."battlePassLevels" alter column "minProgressXp" set default '0'::bigint;

alter table "public"."battlePassLevels" alter column "xp" set default '0'::bigint;

alter table "public"."battlePassMapPackProgress" drop column "completedLevels";



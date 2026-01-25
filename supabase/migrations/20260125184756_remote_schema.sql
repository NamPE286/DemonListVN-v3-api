alter table "public"."battlePassMapPackProgress" drop column "completedLevels";

alter table "public"."battlePassMapPackProgress" add column "progress" bigint not null default '0'::bigint;



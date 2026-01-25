alter table "public"."battlePassMapPackProgress" add column "completedLevels" bigint[] not null default '{}'::bigint[];



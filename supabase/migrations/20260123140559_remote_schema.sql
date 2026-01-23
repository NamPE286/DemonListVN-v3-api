alter table "public"."playerSubscriptions" drop column "refId";

alter table "public"."subscriptions" add column "refId" bigint;



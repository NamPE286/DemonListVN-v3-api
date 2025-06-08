alter table "public"."orders" alter column "amount" drop default;

alter table "public"."orders" alter column "currency" set default ''::text;

alter table "public"."players" add column "DiscordDMChannelID" bigint;



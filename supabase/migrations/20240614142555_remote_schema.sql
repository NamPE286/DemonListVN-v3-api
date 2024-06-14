alter table "public"."clans" drop constraint "clans_tag_check";

alter table "public"."clanInvitations" drop constraint "clanInvitations_pkey";

drop index if exists "public"."clanInvitations_pkey";

alter table "public"."clans" add column "memberCount" bigint not null default '1'::bigint;

alter table "public"."clans" add column "rank" bigint;

alter table "public"."clans" add column "rating" bigint not null default '0'::bigint;

CREATE UNIQUE INDEX "clanInvitations_pkey" ON public."clanInvitations" USING btree ("to");

alter table "public"."clanInvitations" add constraint "clanInvitations_pkey" PRIMARY KEY using index "clanInvitations_pkey";

alter table "public"."players" add constraint "players_name_check" CHECK ((length((name)::text) <= 35)) not valid;

alter table "public"."players" validate constraint "players_name_check";

alter table "public"."clans" add constraint "clans_tag_check" CHECK (((length(tag) <= 6) AND (length(tag) >= 2))) not valid;

alter table "public"."clans" validate constraint "clans_tag_check";



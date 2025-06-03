alter table "public"."players" drop constraint "players_name_check";

alter table "public"."players" alter column "name" set data type text using "name"::text;

CREATE UNIQUE INDEX players_name_key ON public.players USING btree (name);

alter table "public"."clans" add constraint "clans_name_check" CHECK ((length(name) <= 30)) not valid;

alter table "public"."clans" validate constraint "clans_name_check";

alter table "public"."players" add constraint "players_name_key" UNIQUE using index "players_name_key";

alter table "public"."players" add constraint "players_name_check" CHECK ((length(name) <= 35)) not valid;

alter table "public"."players" validate constraint "players_name_check";



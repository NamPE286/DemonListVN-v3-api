alter table "public"."players" alter column "avatar" set data type text using "avatar"::text;

alter table "public"."players" alter column "discord" set data type bigint using "discord"::bigint;

alter table "public"."players" alter column "email" set data type text using "email"::text;

alter table "public"."players" alter column "facebook" set data type text using "facebook"::text;

alter table "public"."players" alter column "youtube" set data type text using "youtube"::text;



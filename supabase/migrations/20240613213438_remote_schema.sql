alter table "public"."clanInvitations" drop constraint "clanInvitations_pkey";

drop index if exists "public"."clanInvitations_pkey";

create table "public"."clanBan" (
    "created_at" timestamp with time zone not null default now(),
    "userid" uuid not null,
    "clan" bigint not null
);


alter table "public"."clanBan" enable row level security;

alter table "public"."clans" add column "tagBgColor" text;

alter table "public"."clans" add column "tagTextColor" text;

CREATE UNIQUE INDEX "clanBan_pkey" ON public."clanBan" USING btree (userid, clan);

CREATE UNIQUE INDEX "clanInvitations_pkey" ON public."clanInvitations" USING btree ("to", clan);

alter table "public"."clanBan" add constraint "clanBan_pkey" PRIMARY KEY using index "clanBan_pkey";

alter table "public"."clanInvitations" add constraint "clanInvitations_pkey" PRIMARY KEY using index "clanInvitations_pkey";

alter table "public"."clanBan" add constraint "clanBan_clan_fkey" FOREIGN KEY (clan) REFERENCES clans(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."clanBan" validate constraint "clanBan_clan_fkey";

alter table "public"."clanBan" add constraint "clanBan_userid_fkey" FOREIGN KEY (userid) REFERENCES players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."clanBan" validate constraint "clanBan_userid_fkey";

grant delete on table "public"."clanBan" to "anon";

grant insert on table "public"."clanBan" to "anon";

grant references on table "public"."clanBan" to "anon";

grant select on table "public"."clanBan" to "anon";

grant trigger on table "public"."clanBan" to "anon";

grant truncate on table "public"."clanBan" to "anon";

grant update on table "public"."clanBan" to "anon";

grant delete on table "public"."clanBan" to "authenticated";

grant insert on table "public"."clanBan" to "authenticated";

grant references on table "public"."clanBan" to "authenticated";

grant select on table "public"."clanBan" to "authenticated";

grant trigger on table "public"."clanBan" to "authenticated";

grant truncate on table "public"."clanBan" to "authenticated";

grant update on table "public"."clanBan" to "authenticated";

grant delete on table "public"."clanBan" to "service_role";

grant insert on table "public"."clanBan" to "service_role";

grant references on table "public"."clanBan" to "service_role";

grant select on table "public"."clanBan" to "service_role";

grant trigger on table "public"."clanBan" to "service_role";

grant truncate on table "public"."clanBan" to "service_role";

grant update on table "public"."clanBan" to "service_role";



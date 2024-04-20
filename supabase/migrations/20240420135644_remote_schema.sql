create table "public"."APIKey" (
    "created_at" timestamp with time zone not null default now(),
    "key" text not null default md5((random())::text),
    "uid" uuid not null
);


alter table "public"."APIKey" enable row level security;

CREATE UNIQUE INDEX "APIKey_pkey" ON public."APIKey" USING btree (created_at);

alter table "public"."APIKey" add constraint "APIKey_pkey" PRIMARY KEY using index "APIKey_pkey";

alter table "public"."APIKey" add constraint "public_APIKey_uid_fkey" FOREIGN KEY (uid) REFERENCES players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."APIKey" validate constraint "public_APIKey_uid_fkey";

grant delete on table "public"."APIKey" to "anon";

grant insert on table "public"."APIKey" to "anon";

grant references on table "public"."APIKey" to "anon";

grant select on table "public"."APIKey" to "anon";

grant trigger on table "public"."APIKey" to "anon";

grant truncate on table "public"."APIKey" to "anon";

grant update on table "public"."APIKey" to "anon";

grant delete on table "public"."APIKey" to "authenticated";

grant insert on table "public"."APIKey" to "authenticated";

grant references on table "public"."APIKey" to "authenticated";

grant select on table "public"."APIKey" to "authenticated";

grant trigger on table "public"."APIKey" to "authenticated";

grant truncate on table "public"."APIKey" to "authenticated";

grant update on table "public"."APIKey" to "authenticated";

grant delete on table "public"."APIKey" to "service_role";

grant insert on table "public"."APIKey" to "service_role";

grant references on table "public"."APIKey" to "service_role";

grant select on table "public"."APIKey" to "service_role";

grant trigger on table "public"."APIKey" to "service_role";

grant truncate on table "public"."APIKey" to "service_role";

grant update on table "public"."APIKey" to "service_role";



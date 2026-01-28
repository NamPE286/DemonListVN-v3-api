
  create table "public"."wiki" (
    "path" text not null,
    "created_at" timestamp with time zone not null default now(),
    "title" text not null,
    "description" text
      );


alter table "public"."wiki" enable row level security;

CREATE UNIQUE INDEX wiki_pkey ON public.wiki USING btree (path);

alter table "public"."wiki" add constraint "wiki_pkey" PRIMARY KEY using index "wiki_pkey";

grant delete on table "public"."wiki" to "anon";

grant insert on table "public"."wiki" to "anon";

grant references on table "public"."wiki" to "anon";

grant select on table "public"."wiki" to "anon";

grant trigger on table "public"."wiki" to "anon";

grant truncate on table "public"."wiki" to "anon";

grant update on table "public"."wiki" to "anon";

grant delete on table "public"."wiki" to "authenticated";

grant insert on table "public"."wiki" to "authenticated";

grant references on table "public"."wiki" to "authenticated";

grant select on table "public"."wiki" to "authenticated";

grant trigger on table "public"."wiki" to "authenticated";

grant truncate on table "public"."wiki" to "authenticated";

grant update on table "public"."wiki" to "authenticated";

grant delete on table "public"."wiki" to "service_role";

grant insert on table "public"."wiki" to "service_role";

grant references on table "public"."wiki" to "service_role";

grant select on table "public"."wiki" to "service_role";

grant trigger on table "public"."wiki" to "service_role";

grant truncate on table "public"."wiki" to "service_role";

grant update on table "public"."wiki" to "service_role";



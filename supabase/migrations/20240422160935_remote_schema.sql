create table "public"."levelDeathCount" (
    "levelID" bigint generated by default as identity not null,
    "count" bigint[] not null
);


alter table "public"."levelDeathCount" enable row level security;

alter table "public"."levelDeathCount" add constraint "deathCount_count_check" CHECK ((cardinality(count) = 100)) not valid;

alter table "public"."levelDeathCount" validate constraint "deathCount_count_check";

grant delete on table "public"."levelDeathCount" to "anon";

grant insert on table "public"."levelDeathCount" to "anon";

grant references on table "public"."levelDeathCount" to "anon";

grant select on table "public"."levelDeathCount" to "anon";

grant trigger on table "public"."levelDeathCount" to "anon";

grant truncate on table "public"."levelDeathCount" to "anon";

grant update on table "public"."levelDeathCount" to "anon";

grant delete on table "public"."levelDeathCount" to "authenticated";

grant insert on table "public"."levelDeathCount" to "authenticated";

grant references on table "public"."levelDeathCount" to "authenticated";

grant select on table "public"."levelDeathCount" to "authenticated";

grant trigger on table "public"."levelDeathCount" to "authenticated";

grant truncate on table "public"."levelDeathCount" to "authenticated";

grant update on table "public"."levelDeathCount" to "authenticated";

grant delete on table "public"."levelDeathCount" to "service_role";

grant insert on table "public"."levelDeathCount" to "service_role";

grant references on table "public"."levelDeathCount" to "service_role";

grant select on table "public"."levelDeathCount" to "service_role";

grant trigger on table "public"."levelDeathCount" to "service_role";

grant truncate on table "public"."levelDeathCount" to "service_role";

grant update on table "public"."levelDeathCount" to "service_role";



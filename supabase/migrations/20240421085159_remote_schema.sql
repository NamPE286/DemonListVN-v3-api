create table "public"."heatmap" (
    "uid" uuid not null,
    "year" bigint not null,
    "days" bigint[] not null
);


alter table "public"."heatmap" enable row level security;

CREATE UNIQUE INDEX attempts_pkey ON public.heatmap USING btree (uid, year);

alter table "public"."heatmap" add constraint "attempts_pkey" PRIMARY KEY using index "attempts_pkey";

alter table "public"."heatmap" add constraint "attempts_days_check" CHECK ((cardinality(days) = 366)) not valid;

alter table "public"."heatmap" validate constraint "attempts_days_check";

alter table "public"."heatmap" add constraint "public_attempts_uid_fkey" FOREIGN KEY (uid) REFERENCES players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."heatmap" validate constraint "public_attempts_uid_fkey";

grant delete on table "public"."heatmap" to "anon";

grant insert on table "public"."heatmap" to "anon";

grant references on table "public"."heatmap" to "anon";

grant select on table "public"."heatmap" to "anon";

grant trigger on table "public"."heatmap" to "anon";

grant truncate on table "public"."heatmap" to "anon";

grant update on table "public"."heatmap" to "anon";

grant delete on table "public"."heatmap" to "authenticated";

grant insert on table "public"."heatmap" to "authenticated";

grant references on table "public"."heatmap" to "authenticated";

grant select on table "public"."heatmap" to "authenticated";

grant trigger on table "public"."heatmap" to "authenticated";

grant truncate on table "public"."heatmap" to "authenticated";

grant update on table "public"."heatmap" to "authenticated";

grant delete on table "public"."heatmap" to "service_role";

grant insert on table "public"."heatmap" to "service_role";

grant references on table "public"."heatmap" to "service_role";

grant select on table "public"."heatmap" to "service_role";

grant trigger on table "public"."heatmap" to "service_role";

grant truncate on table "public"."heatmap" to "service_role";

grant update on table "public"."heatmap" to "service_role";



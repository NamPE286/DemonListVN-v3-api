create table "public"."eventProofs" (
    "created_at" timestamp with time zone not null default now(),
    "userid" uuid not null,
    "eventID" bigint not null,
    "content" text not null,
    "accepted" boolean not null default false
);


alter table "public"."eventProofs" enable row level security;

alter table "public"."events" add column "content" text;

alter table "public"."events" add column "exp" bigint;

alter table "public"."events" add column "redirect" text;

alter table "public"."events" alter column "end" drop not null;

CREATE UNIQUE INDEX "eventProofs_pkey" ON public."eventProofs" USING btree (userid, "eventID");

alter table "public"."eventProofs" add constraint "eventProofs_pkey" PRIMARY KEY using index "eventProofs_pkey";

alter table "public"."eventProofs" add constraint "eventProof_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES events(id) not valid;

alter table "public"."eventProofs" validate constraint "eventProof_eventID_fkey";

alter table "public"."eventProofs" add constraint "eventProof_userid_fkey" FOREIGN KEY (userid) REFERENCES players(uid) not valid;

alter table "public"."eventProofs" validate constraint "eventProof_userid_fkey";

grant delete on table "public"."eventProofs" to "anon";

grant insert on table "public"."eventProofs" to "anon";

grant references on table "public"."eventProofs" to "anon";

grant select on table "public"."eventProofs" to "anon";

grant trigger on table "public"."eventProofs" to "anon";

grant truncate on table "public"."eventProofs" to "anon";

grant update on table "public"."eventProofs" to "anon";

grant delete on table "public"."eventProofs" to "authenticated";

grant insert on table "public"."eventProofs" to "authenticated";

grant references on table "public"."eventProofs" to "authenticated";

grant select on table "public"."eventProofs" to "authenticated";

grant trigger on table "public"."eventProofs" to "authenticated";

grant truncate on table "public"."eventProofs" to "authenticated";

grant update on table "public"."eventProofs" to "authenticated";

grant delete on table "public"."eventProofs" to "service_role";

grant insert on table "public"."eventProofs" to "service_role";

grant references on table "public"."eventProofs" to "service_role";

grant select on table "public"."eventProofs" to "service_role";

grant trigger on table "public"."eventProofs" to "service_role";

grant truncate on table "public"."eventProofs" to "service_role";

grant update on table "public"."eventProofs" to "service_role";



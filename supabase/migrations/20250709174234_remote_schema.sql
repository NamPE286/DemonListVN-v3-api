alter table "public"."eventRecords" alter column "accepted" drop default;

alter table "public"."eventRecords" alter column "accepted" drop not null;

alter table "public"."medals" add column "redirect" text;

alter table "public"."playerMedals" add column "created_at" timestamp with time zone not null default now();

CREATE UNIQUE INDEX "eventRecords_pkey" ON public."eventRecords" USING btree ("userID", "levelID");

alter table "public"."eventRecords" add constraint "eventRecords_pkey" PRIMARY KEY using index "eventRecords_pkey";



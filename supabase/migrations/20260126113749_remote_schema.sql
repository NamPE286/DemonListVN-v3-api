alter table "public"."deathCount" drop constraint "deathCount_pkey";

drop index if exists "public"."deathCount_pkey";

alter table "public"."deathCount" add column "tag" text not null default 'default'::text;

CREATE UNIQUE INDEX "deathCount_pkey" ON public."deathCount" USING btree ("levelID", uid, tag);

alter table "public"."deathCount" add constraint "deathCount_pkey" PRIMARY KEY using index "deathCount_pkey";



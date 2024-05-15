alter table "public"."levels" add column "avgSuggestedRating" bigint;

alter table "public"."records" add column "suggestedRating" bigint;

CREATE UNIQUE INDEX "levelDeathCount_pkey" ON public."levelDeathCount" USING btree ("levelID");

alter table "public"."levelDeathCount" add constraint "levelDeathCount_pkey" PRIMARY KEY using index "levelDeathCount_pkey";



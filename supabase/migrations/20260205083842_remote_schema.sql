alter table "public"."levels" add column "creatorId" uuid;

alter table "public"."levels" add constraint "levels_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public.players(uid) not valid;

alter table "public"."levels" validate constraint "levels_creatorId_fkey";



alter table "public"."eventRecords" drop constraint "eventRecords_levelID_fkey";

alter table "public"."events" add column "hidden" boolean not null default false;

alter table "public"."eventRecords" add constraint "eventRecords_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES "eventLevels"(id) ON UPDATE CASCADE not valid;

alter table "public"."eventRecords" validate constraint "eventRecords_levelID_fkey";



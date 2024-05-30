alter table "public"."records" add column "reviewer" uuid;

alter table "public"."records" add constraint "records_reviewer_fkey" FOREIGN KEY (reviewer) REFERENCES players(uid) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."records" validate constraint "records_reviewer_fkey";



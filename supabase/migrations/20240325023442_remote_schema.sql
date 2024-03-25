alter table "public"."records" drop constraint "records_levelid_fkey";

alter table "public"."records" drop constraint "records_userid_fkey";

alter table "public"."records" add constraint "public_records_levelid_fkey" FOREIGN KEY (levelid) REFERENCES levels(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."records" validate constraint "public_records_levelid_fkey";

alter table "public"."records" add constraint "public_records_userid_fkey" FOREIGN KEY (userid) REFERENCES players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."records" validate constraint "public_records_userid_fkey";



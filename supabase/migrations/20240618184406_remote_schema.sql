alter table "public"."clans" add constraint "clans_memberLimit_check" CHECK (("memberLimit" <= 500)) not valid;

alter table "public"."clans" validate constraint "clans_memberLimit_check";



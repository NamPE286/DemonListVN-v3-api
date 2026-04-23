-- Allow a pending record to coexist with an already-accepted record for the
-- same (userid, levelid) pair so that submitting a better record does not
-- overwrite the user's current accepted record. The old record is kept until
-- the new one is accepted (then the old one is removed) or rejected (then the
-- pending one is removed and the old stays).

-- Switch primary key from (userid, levelid) to (id) so multiple rows may
-- share the same (userid, levelid) pair.
alter table "public"."records"
drop constraint "records_pkey";

-- `id` already has a UNIQUE constraint (records_id_key); drop it before
-- promoting it to the primary key (PK creates its own unique index).
alter table "public"."records"
drop constraint "records_id_key";

alter table "public"."records"
add constraint "records_pkey" primary key ("id");

-- Enforce at most one accepted record per (userid, levelid).
create unique index "records_accepted_userid_levelid_key"
on "public"."records" ("userid", "levelid")
where ("acceptedManually" is true or "acceptedAuto" is true);

-- Enforce at most one pending record per (userid, levelid).
create unique index "records_pending_userid_levelid_key"
on "public"."records" ("userid", "levelid")
where (coalesce("acceptedManually", false) = false and "acceptedAuto" = false);

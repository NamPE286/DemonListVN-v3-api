DROP INDEX IF EXISTS "public"."records_accepted_userid_levelid_key";

CREATE UNIQUE INDEX IF NOT EXISTS "records_manually_accepted_userid_levelid_key"
ON "public"."records" USING "btree" ("userid", "levelid")
WHERE ("acceptedManually" IS TRUE);

CREATE UNIQUE INDEX IF NOT EXISTS "records_auto_accepted_userid_levelid_key"
ON "public"."records" USING "btree" ("userid", "levelid")
WHERE ((COALESCE("acceptedManually", false) = false) AND ("acceptedAuto" IS TRUE));

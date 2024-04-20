CREATE UNIQUE INDEX "APIKey_key_key" ON public."APIKey" USING btree (key);

alter table "public"."APIKey" add constraint "APIKey_key_key" UNIQUE using index "APIKey_key_key";



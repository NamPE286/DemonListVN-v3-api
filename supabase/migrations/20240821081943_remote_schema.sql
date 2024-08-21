CREATE INDEX refresh_token_session_id ON auth.refresh_tokens USING btree (session_id);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION auth.email()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.email', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
	)::text
$function$
;

CREATE OR REPLACE FUNCTION auth.role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.role', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
	)::text
$function$
;

CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.sub', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
	)::uuid
$function$
;


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION storage.extension(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return split_part(_filename, '.', 2);
END
$function$
;

create policy "Enable read access for all users"
on "storage"."buckets"
as permissive
for insert
to public
with check (true);


create policy "allowAll 1bfp7qv_0"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'clanPhotos'::text));


create policy "allowAll 1bfp7qv_1"
on "storage"."objects"
as permissive
for insert
to public
with check ((bucket_id = 'clanPhotos'::text));


create policy "allowAll 1bfp7qv_2"
on "storage"."objects"
as permissive
for update
to public
using ((bucket_id = 'clanPhotos'::text));


create policy "ava 1oj01fe_0"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'avatars'::text));


create policy "ava 1oj01fe_1"
on "storage"."objects"
as permissive
for insert
to public
with check ((bucket_id = 'avatars'::text));


create policy "ava 1oj01fe_2"
on "storage"."objects"
as permissive
for update
to public
using ((bucket_id = 'avatars'::text));


create policy "ava 1oj01fe_3"
on "storage"."objects"
as permissive
for delete
to public
using ((bucket_id = 'avatars'::text));


create policy "upload 1t9jwe_0"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'songs'::text));


create policy "upload 1t9jwe_1"
on "storage"."objects"
as permissive
for insert
to public
with check ((bucket_id = 'songs'::text));




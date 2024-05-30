create type "auth"."one_time_token_type" as enum ('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');

create table "auth"."one_time_tokens" (
    "id" uuid not null,
    "user_id" uuid not null,
    "token_type" auth.one_time_token_type not null,
    "token_hash" text not null,
    "relates_to" text not null,
    "created_at" timestamp without time zone not null default now(),
    "updated_at" timestamp without time zone not null default now()
);


alter table "auth"."flow_state" add column "auth_code_issued_at" timestamp with time zone;

CREATE UNIQUE INDEX one_time_tokens_pkey ON auth.one_time_tokens USING btree (id);

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);

CREATE INDEX refresh_token_session_id ON auth.refresh_tokens USING btree (session_id);

alter table "auth"."one_time_tokens" add constraint "one_time_tokens_pkey" PRIMARY KEY using index "one_time_tokens_pkey";

alter table "auth"."one_time_tokens" add constraint "one_time_tokens_token_hash_check" CHECK ((char_length(token_hash) > 0)) not valid;

alter table "auth"."one_time_tokens" validate constraint "one_time_tokens_token_hash_check";

alter table "auth"."one_time_tokens" add constraint "one_time_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "auth"."one_time_tokens" validate constraint "one_time_tokens_user_id_fkey";

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

grant delete on table "auth"."one_time_tokens" to "dashboard_user";

grant insert on table "auth"."one_time_tokens" to "dashboard_user";

grant references on table "auth"."one_time_tokens" to "dashboard_user";

grant select on table "auth"."one_time_tokens" to "dashboard_user";

grant trigger on table "auth"."one_time_tokens" to "dashboard_user";

grant truncate on table "auth"."one_time_tokens" to "dashboard_user";

grant update on table "auth"."one_time_tokens" to "dashboard_user";

grant delete on table "auth"."one_time_tokens" to "postgres";

grant insert on table "auth"."one_time_tokens" to "postgres";

grant references on table "auth"."one_time_tokens" to "postgres";

grant select on table "auth"."one_time_tokens" to "postgres";

grant trigger on table "auth"."one_time_tokens" to "postgres";

grant truncate on table "auth"."one_time_tokens" to "postgres";

grant update on table "auth"."one_time_tokens" to "postgres";


create table "storage"."s3_multipart_uploads" (
    "id" text not null,
    "in_progress_size" bigint not null default 0,
    "upload_signature" text not null,
    "bucket_id" text not null,
    "key" text not null,
    "version" text not null,
    "owner_id" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "storage"."s3_multipart_uploads" enable row level security;

create table "storage"."s3_multipart_uploads_parts" (
    "id" uuid not null default gen_random_uuid(),
    "upload_id" text not null,
    "size" bigint not null default 0,
    "part_number" integer not null,
    "bucket_id" text not null,
    "key" text not null,
    "etag" text not null,
    "owner_id" text,
    "version" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "storage"."s3_multipart_uploads_parts" enable row level security;

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");

CREATE UNIQUE INDEX s3_multipart_uploads_parts_pkey ON storage.s3_multipart_uploads_parts USING btree (id);

CREATE UNIQUE INDEX s3_multipart_uploads_pkey ON storage.s3_multipart_uploads USING btree (id);

alter table "storage"."s3_multipart_uploads" add constraint "s3_multipart_uploads_pkey" PRIMARY KEY using index "s3_multipart_uploads_pkey";

alter table "storage"."s3_multipart_uploads_parts" add constraint "s3_multipart_uploads_parts_pkey" PRIMARY KEY using index "s3_multipart_uploads_parts_pkey";

alter table "storage"."s3_multipart_uploads" add constraint "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) not valid;

alter table "storage"."s3_multipart_uploads" validate constraint "s3_multipart_uploads_bucket_id_fkey";

alter table "storage"."s3_multipart_uploads_parts" add constraint "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) not valid;

alter table "storage"."s3_multipart_uploads_parts" validate constraint "s3_multipart_uploads_parts_bucket_id_fkey";

alter table "storage"."s3_multipart_uploads_parts" add constraint "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE not valid;

alter table "storage"."s3_multipart_uploads_parts" validate constraint "s3_multipart_uploads_parts_upload_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text)
 RETURNS TABLE(key text, id text, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text)
 RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$function$
;

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

CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$function$
;

grant select on table "storage"."s3_multipart_uploads" to "anon";

grant select on table "storage"."s3_multipart_uploads" to "authenticated";

grant delete on table "storage"."s3_multipart_uploads" to "service_role";

grant insert on table "storage"."s3_multipart_uploads" to "service_role";

grant references on table "storage"."s3_multipart_uploads" to "service_role";

grant select on table "storage"."s3_multipart_uploads" to "service_role";

grant trigger on table "storage"."s3_multipart_uploads" to "service_role";

grant truncate on table "storage"."s3_multipart_uploads" to "service_role";

grant update on table "storage"."s3_multipart_uploads" to "service_role";

grant select on table "storage"."s3_multipart_uploads_parts" to "anon";

grant select on table "storage"."s3_multipart_uploads_parts" to "authenticated";

grant delete on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant insert on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant references on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant select on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant trigger on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant truncate on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant update on table "storage"."s3_multipart_uploads_parts" to "service_role";

create policy "Enable read access for all users"
on "storage"."buckets"
as permissive
for insert
to public
with check (true);


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




create policy "Enable read access for all users"
on "public"."clans"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."events"
as permissive
for select
to public
using (true);




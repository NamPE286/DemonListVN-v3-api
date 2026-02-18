do $$
declare
    table_record record;
    column_record record;
    constraint_record record;
begin
    for table_record in
        select table_name
        from information_schema.tables
        where table_schema = 'public'
            and table_type = 'BASE TABLE'
            and table_name ~ '[A-Z]'
    loop
        execute format(
            'alter table public.%I rename to %I',
            table_record.table_name,
            lower(regexp_replace(regexp_replace(table_record.table_name, '([A-Z]+)([A-Z][a-z])', '\1_\2', 'g'), '([a-z0-9])([A-Z])', '\1_\2', 'g'))
        );
    end loop;

    for column_record in
        select table_name, column_name
        from information_schema.columns
        where table_schema = 'public'
            and column_name ~ '[A-Z]'
    loop
        execute format(
            'alter table public.%I rename column %I to %I',
            column_record.table_name,
            column_record.column_name,
            lower(regexp_replace(regexp_replace(column_record.column_name, '([A-Z]+)([A-Z][a-z])', '\1_\2', 'g'), '([a-z0-9])([A-Z])', '\1_\2', 'g'))
        );
    end loop;

    for constraint_record in
        select n.nspname as schema_name, c.relname as table_name, con.conname as constraint_name
        from pg_constraint con
        join pg_class c on c.oid = con.conrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
            and con.conname ~ '[A-Z]'
    loop
        execute format(
            'alter table %I.%I rename constraint %I to %I',
            constraint_record.schema_name,
            constraint_record.table_name,
            constraint_record.constraint_name,
            lower(regexp_replace(regexp_replace(constraint_record.constraint_name, '([A-Z]+)([A-Z][a-z])', '\1_\2', 'g'), '([a-z0-9])([A-Z])', '\1_\2', 'g'))
        );
    end loop;
end;
$$;

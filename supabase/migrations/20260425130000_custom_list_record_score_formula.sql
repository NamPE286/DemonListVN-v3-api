alter table "public"."lists"
add column if not exists "recordScoreFormula" text not null default '1';

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'lists_record_score_formula_check'
    ) then
        alter table "public"."lists"
        add constraint "lists_record_score_formula_check"
        check ((length("recordScoreFormula") >= 1) and (length("recordScoreFormula") <= 500));
    end if;
end $$;

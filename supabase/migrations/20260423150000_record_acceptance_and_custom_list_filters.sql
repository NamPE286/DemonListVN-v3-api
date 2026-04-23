alter table "public"."records"
rename column "isChecked" to "acceptedManually";

alter table "public"."records"
add column "acceptedAuto" boolean not null default false;

alter table "public"."lists"
add column "recordFilterPlatform" text not null default 'any',
add column "recordFilterMinRefreshRate" integer,
add column "recordFilterMaxRefreshRate" integer,
add column "recordFilterManualAcceptanceOnly" boolean not null default true;

alter table "public"."lists"
add constraint "lists_recordFilterPlatform_check"
check ("recordFilterPlatform" in ('any', 'pc', 'mobile'));

alter table "public"."lists"
add constraint "lists_recordFilterRefreshRate_check"
check (
    ("recordFilterMinRefreshRate" is null or "recordFilterMinRefreshRate" > 0)
    and ("recordFilterMaxRefreshRate" is null or "recordFilterMaxRefreshRate" > 0)
    and (
        "recordFilterMinRefreshRate" is null
        or "recordFilterMaxRefreshRate" is null
        or "recordFilterMinRefreshRate" <= "recordFilterMaxRefreshRate"
    )
);

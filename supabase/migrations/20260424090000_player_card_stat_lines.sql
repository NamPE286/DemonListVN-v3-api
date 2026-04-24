create table "public"."playerCardStatLines" (
    "uid" uuid not null references "public"."players"("uid") on delete cascade,
    "position" smallint not null check ("position" >= 0 and "position" < 16),
    "listId" bigint not null references "public"."lists"("id") on delete cascade,
    primary key ("uid", "position")
);

create index "playerCardStatLines_listId_idx" on "public"."playerCardStatLines" ("listId");

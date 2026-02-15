alter table "public"."playerConvictions"
add column if not exists "isHidden" boolean not null default false;

create index if not exists "playerConvictions_userId_created_at_idx"
on "public"."playerConvictions" ("userId", "created_at" desc);

create index if not exists "playerConvictions_userId_isHidden_created_at_idx"
on "public"."playerConvictions" ("userId", "isHidden", "created_at" desc);

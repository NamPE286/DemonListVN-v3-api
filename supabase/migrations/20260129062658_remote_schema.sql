alter table "public"."wiki" drop constraint "wiki_pkey";

drop index if exists "public"."wiki_pkey";

alter table "public"."wiki" add column "modifiedAt" timestamp with time zone not null default now();

CREATE UNIQUE INDEX wiki_pkey ON public.wiki USING btree (path, locale);

alter table "public"."wiki" add constraint "wiki_pkey" PRIMARY KEY using index "wiki_pkey";



alter table public.lists
add column if not exists "itemSort" text not null default 'mode_default';

alter table public.lists
drop constraint if exists lists_item_sort_check;

alter table public.lists
add constraint lists_item_sort_check
check ("itemSort" in ('mode_default', 'created_at'));
-- Community Hub tables (Steam-style community)

-- Posts table
create table if not exists public.community_posts (
    id serial primary key,
    uid uuid not null references public.players(uid) on delete cascade,
    title text not null,
    content text not null default '',
    type text not null default 'discussion' check (type in ('discussion', 'media', 'guide', 'announcement')),
    image_url text,
    video_url text,
    attached_record jsonb,
    attached_level jsonb,
    pinned boolean not null default false,
    likes_count integer not null default 0,
    comments_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Comments table
create table if not exists public.community_comments (
    id serial primary key,
    post_id integer not null references public.community_posts(id) on delete cascade,
    uid uuid not null references public.players(uid) on delete cascade,
    content text not null,
    likes_count integer not null default 0,
    created_at timestamptz not null default now()
);

-- Likes table (unified for posts and comments)
create table if not exists public.community_likes (
    id serial primary key,
    uid uuid not null references public.players(uid) on delete cascade,
    post_id integer references public.community_posts(id) on delete cascade,
    comment_id integer references public.community_comments(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint community_likes_target_check check (
        (post_id is not null and comment_id is null) or
        (post_id is null and comment_id is not null)
    ),
    constraint community_likes_post_unique unique (uid, post_id),
    constraint community_likes_comment_unique unique (uid, comment_id)
);

-- Indexes
create index if not exists idx_community_posts_uid on public.community_posts(uid);
create index if not exists idx_community_posts_type on public.community_posts(type);
create index if not exists idx_community_posts_created_at on public.community_posts(created_at desc);
create index if not exists idx_community_posts_pinned on public.community_posts(pinned desc, created_at desc);
create index if not exists idx_community_comments_post_id on public.community_comments(post_id);
create index if not exists idx_community_comments_uid on public.community_comments(uid);
create index if not exists idx_community_likes_post_id on public.community_likes(post_id);
create index if not exists idx_community_likes_comment_id on public.community_likes(comment_id);
create index if not exists idx_community_likes_uid on public.community_likes(uid);

-- RLS policies
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;

-- Everyone can read
create policy "community_posts_read" on public.community_posts for select using (true);
create policy "community_comments_read" on public.community_comments for select using (true);
create policy "community_likes_read" on public.community_likes for select using (true);

-- Authenticated users can insert their own
create policy "community_posts_insert" on public.community_posts for insert with check (auth.uid() = uid);
create policy "community_comments_insert" on public.community_comments for insert with check (auth.uid() = uid);
create policy "community_likes_insert" on public.community_likes for insert with check (auth.uid() = uid);

-- Users update/delete their own posts
create policy "community_posts_update" on public.community_posts for update using (auth.uid() = uid);
create policy "community_posts_delete" on public.community_posts for delete using (auth.uid() = uid);
create policy "community_comments_delete" on public.community_comments for delete using (auth.uid() = uid);
create policy "community_likes_delete" on public.community_likes for delete using (auth.uid() = uid);

-- Function to auto-update updated_at
create or replace function public.update_community_post_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger community_posts_updated_at
    before update on public.community_posts
    for each row
    execute function public.update_community_post_updated_at();

-- Function to update comments_count on community_posts
create or replace function public.update_community_comments_count()
returns trigger as $$
begin
    if tg_op = 'INSERT' then
        update public.community_posts set comments_count = comments_count + 1 where id = new.post_id;
        return new;
    elsif tg_op = 'DELETE' then
        update public.community_posts set comments_count = comments_count - 1 where id = old.post_id;
        return old;
    end if;
    return null;
end;
$$ language plpgsql;

create trigger community_comments_count_trigger
    after insert or delete on public.community_comments
    for each row
    execute function public.update_community_comments_count();

-- Function to update likes_count on posts/comments
create or replace function public.update_community_likes_count()
returns trigger as $$
begin
    if tg_op = 'INSERT' then
        if new.post_id is not null then
            update public.community_posts set likes_count = likes_count + 1 where id = new.post_id;
        end if;
        if new.comment_id is not null then
            update public.community_comments set likes_count = likes_count + 1 where id = new.comment_id;
        end if;
        return new;
    elsif tg_op = 'DELETE' then
        if old.post_id is not null then
            update public.community_posts set likes_count = likes_count - 1 where id = old.post_id;
        end if;
        if old.comment_id is not null then
            update public.community_comments set likes_count = likes_count - 1 where id = old.comment_id;
        end if;
        return old;
    end if;
    return null;
end;
$$ language plpgsql;

create trigger community_likes_count_trigger
    after insert or delete on public.community_likes
    for each row
    execute function public.update_community_likes_count();

-- Reports table
create table if not exists public.community_reports (
    id serial primary key,
    uid uuid not null references public.players(uid) on delete cascade,
    post_id integer references public.community_posts(id) on delete cascade,
    comment_id integer references public.community_comments(id) on delete cascade,
    reason text not null default 'inappropriate' check (reason in ('inappropriate', 'spam', 'harassment', 'misinformation', 'other')),
    description text,
    resolved boolean not null default false,
    created_at timestamptz not null default now(),
    constraint community_reports_target_check check (
        (post_id is not null and comment_id is null) or
        (post_id is null and comment_id is not null)
    ),
    constraint community_reports_unique unique (uid, post_id, comment_id)
);

create index if not exists idx_community_reports_post_id on public.community_reports(post_id);
create index if not exists idx_community_reports_resolved on public.community_reports(resolved);

alter table public.community_reports enable row level security;
create policy "community_reports_read" on public.community_reports for select using (true);
create policy "community_reports_insert" on public.community_reports for insert with check (auth.uid() = uid);
create policy "community_reports_delete" on public.community_reports for delete using (auth.uid() = uid);

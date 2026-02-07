-- Add review post type and is_recommended column

-- Drop and recreate the CHECK constraint to include 'review'
ALTER TABLE public.community_posts
    DROP CONSTRAINT IF EXISTS community_posts_type_check;

ALTER TABLE public.community_posts
    ADD CONSTRAINT community_posts_type_check
    CHECK (type IN ('discussion', 'media', 'guide', 'announcement', 'review'));

-- Add is_recommended column for review posts (null for non-review posts)
ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS is_recommended boolean;

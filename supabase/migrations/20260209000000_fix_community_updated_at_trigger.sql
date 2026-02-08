-- Remove the automatic updated_at trigger
-- We'll manually set updated_at in the API when content is actually edited

DROP TRIGGER IF EXISTS community_posts_updated_at ON public.community_posts;
DROP FUNCTION IF EXISTS public.update_community_post_updated_at();

-- Reset updated_at to null for all existing posts to clear false "edited" markers
-- This fixes posts that were marked as edited due to likes/comments/views incrementing counters
UPDATE public.community_posts
SET updated_at = null
WHERE updated_at IS NOT NULL;

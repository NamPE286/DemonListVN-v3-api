-- Community Enhancements: hidden posts/comments, attached_level on comments,
-- full-text search, auto-hide trigger, player search function

-- 1. Add hidden column to posts and comments
ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

ALTER TABLE public.community_comments
    ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

-- 2. Add attached_level (jsonb) to comments for level tagging
ALTER TABLE public.community_comments
    ADD COLUMN IF NOT EXISTS attached_level jsonb;

-- 3. Add full-text search index on posts (title + content)
-- Create a generated tsvector column for efficient search
ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS fts tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_community_posts_fts ON public.community_posts USING gin(fts);

-- 4. Index for hidden posts filtering
CREATE INDEX IF NOT EXISTS idx_community_posts_hidden ON public.community_posts(hidden);
CREATE INDEX IF NOT EXISTS idx_community_comments_hidden ON public.community_comments(hidden);

-- 5. Function + trigger to auto-hide posts/comments when they reach 10 reports in 24 hours
CREATE OR REPLACE FUNCTION public.auto_hide_reported_content()
RETURNS trigger AS $$
DECLARE
    report_count integer;
BEGIN
    -- Count unresolved reports for this content in the last 24 hours
    IF NEW.post_id IS NOT NULL THEN
        SELECT COUNT(*) INTO report_count
        FROM public.community_reports
        WHERE post_id = NEW.post_id
          AND resolved = false
          AND created_at > now() - interval '24 hours';

        IF report_count >= 10 THEN
            UPDATE public.community_posts SET hidden = true WHERE id = NEW.post_id;
        END IF;
    END IF;

    IF NEW.comment_id IS NOT NULL THEN
        SELECT COUNT(*) INTO report_count
        FROM public.community_reports
        WHERE comment_id = NEW.comment_id
          AND resolved = false
          AND created_at > now() - interval '24 hours';

        IF report_count >= 10 THEN
            UPDATE public.community_comments SET hidden = true WHERE id = NEW.comment_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_auto_hide_trigger
    AFTER INSERT ON public.community_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_hide_reported_content();

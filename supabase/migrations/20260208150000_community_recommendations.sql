-- Community Post Recommendations: view tracking + recommendation scoring function

-- 1. Post views table to track which posts users have seen
CREATE TABLE IF NOT EXISTS public.community_post_views (
    id serial PRIMARY KEY,
    uid uuid NOT NULL REFERENCES public.players(uid) ON DELETE CASCADE,
    post_id integer NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    view_count integer NOT NULL DEFAULT 1,
    last_viewed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT community_post_views_unique UNIQUE (uid, post_id)
);

CREATE INDEX IF NOT EXISTS idx_community_post_views_uid ON public.community_post_views(uid);
CREATE INDEX IF NOT EXISTS idx_community_post_views_post_id ON public.community_post_views(post_id);

-- RLS policies
ALTER TABLE public.community_post_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_post_views_read" ON public.community_post_views FOR SELECT USING (true);
CREATE POLICY "community_post_views_insert" ON public.community_post_views FOR INSERT WITH CHECK (auth.uid() = uid);
CREATE POLICY "community_post_views_update" ON public.community_post_views FOR UPDATE USING (auth.uid() = uid);

-- 2. Add views_count column to posts for quick access
ALTER TABLE public.community_posts
    ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

-- 3. Trigger to increment views_count on community_posts when a view is recorded
CREATE OR REPLACE FUNCTION public.update_community_post_views_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts
        SET views_count = views_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_post_views_count_trigger
    AFTER INSERT ON public.community_post_views
    FOR EACH ROW
    EXECUTE FUNCTION public.update_community_post_views_count();

-- 4. Function to get recommended posts with scoring algorithm
-- Score = engagement_score * recency_multiplier * preference_boost
-- engagement_score = (likes_count * 2 + comments_count * 3 + views_count * 0.1) 
-- recency_multiplier = 1 / (age_hours / 24 + 1) ^ 0.8  (gradual decay over days)
-- preference_boost = 1.5x if the user has liked posts of this type before
CREATE OR REPLACE FUNCTION public.get_recommended_community_posts(
    p_user_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 25,
    p_offset integer DEFAULT 0,
    p_type text DEFAULT NULL
)
RETURNS TABLE (
    id integer,
    uid uuid,
    title text,
    content text,
    type text,
    image_url text,
    video_url text,
    attached_record jsonb,
    attached_level jsonb,
    pinned boolean,
    likes_count integer,
    comments_count integer,
    views_count integer,
    is_recommended boolean,
    hidden boolean,
    created_at timestamptz,
    updated_at timestamptz,
    recommendation_score double precision
) AS $$
DECLARE
    v_preferred_types text[];
BEGIN
    -- Get user's preferred post types (types they've liked most)
    IF p_user_id IS NOT NULL THEN
        SELECT ARRAY_AGG(preferred_type)
        INTO v_preferred_types
        FROM (
            SELECT cp.type AS preferred_type
            FROM public.community_likes cl
            JOIN public.community_posts cp ON cp.id = cl.post_id
            WHERE cl.uid = p_user_id
              AND cl.post_id IS NOT NULL
            GROUP BY cp.type
            ORDER BY COUNT(*) DESC
            LIMIT 3
        ) sub;
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.uid,
        p.title,
        p.content,
        p.type,
        p.image_url,
        p.video_url,
        p.attached_record,
        p.attached_level,
        p.pinned,
        p.likes_count,
        p.comments_count,
        p.views_count,
        p.is_recommended,
        p.hidden,
        p.created_at,
        p.updated_at,
        (
            -- Engagement score
            (p.likes_count * 2.0 + p.comments_count * 3.0 + COALESCE(p.views_count, 0) * 0.1 + 1.0)
            -- Recency multiplier (decays over days, not hours, so recent posts get a boost)
            * (1.0 / POWER(EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0 + 1.0, 0.8))
            -- Preference boost for user's preferred types
            * CASE
                WHEN p_user_id IS NOT NULL AND v_preferred_types IS NOT NULL AND p.type = ANY(v_preferred_types) THEN 1.5
                ELSE 1.0
              END
            -- Penalty for posts user has already viewed many times
            * CASE
                WHEN p_user_id IS NOT NULL THEN
                    COALESCE(
                        1.0 / (1.0 + (SELECT pv.view_count FROM public.community_post_views pv WHERE pv.uid = p_user_id AND pv.post_id = p.id)),
                        1.0
                    )
                ELSE 1.0
              END
            -- Pinned posts get a bonus
            * CASE WHEN p.pinned THEN 2.0 ELSE 1.0 END
        )::double precision AS recommendation_score
    FROM public.community_posts p
    WHERE p.hidden = false
      AND (p_type IS NULL OR p.type = p_type)
    ORDER BY recommendation_score DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Function to record or update a post view
CREATE OR REPLACE FUNCTION public.record_community_post_view(
    p_user_id uuid,
    p_post_id integer
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.community_post_views (uid, post_id, view_count, last_viewed_at)
    VALUES (p_user_id, p_post_id, 1, now())
    ON CONFLICT (uid, post_id)
    DO UPDATE SET
        view_count = community_post_views.view_count + 1,
        last_viewed_at = now();
END;
$$ LANGUAGE plpgsql;

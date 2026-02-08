-- ============================================================
-- 1. Separate admin data from community_posts into a new table
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."community_posts_admin" (
    "post_id" integer NOT NULL PRIMARY KEY,
    "moderation_status" text DEFAULT 'approved' NOT NULL,
    "moderation_result" jsonb,
    "hidden" boolean DEFAULT false NOT NULL,
    CONSTRAINT "community_posts_admin_moderation_status_check" 
        CHECK (moderation_status = ANY (ARRAY['approved', 'pending', 'rejected'])),
    CONSTRAINT "community_posts_admin_post_id_fkey" 
        FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE
);

ALTER TABLE "public"."community_posts_admin" OWNER TO "postgres";

-- Migrate existing data
INSERT INTO "public"."community_posts_admin" (post_id, moderation_status, moderation_result, hidden)
SELECT id, moderation_status, moderation_result, hidden
FROM "public"."community_posts"
ON CONFLICT (post_id) DO NOTHING;

-- Drop the old columns from community_posts
ALTER TABLE "public"."community_posts" DROP COLUMN IF EXISTS "moderation_status";
ALTER TABLE "public"."community_posts" DROP COLUMN IF EXISTS "moderation_result";
ALTER TABLE "public"."community_posts" DROP COLUMN IF EXISTS "hidden";

-- ============================================================
-- 2. Post tag system
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."post_tags" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "color" text DEFAULT '#6b7280' NOT NULL,
    "admin_only" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."post_tags" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."community_posts_tags" (
    "post_id" integer NOT NULL,
    "tag_id" integer NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    CONSTRAINT "community_posts_tags_post_id_fkey"
        FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE,
    CONSTRAINT "community_posts_tags_tag_id_fkey"
        FOREIGN KEY (tag_id) REFERENCES public.post_tags(id) ON DELETE CASCADE
);

ALTER TABLE "public"."community_posts_tags" OWNER TO "postgres";

-- ============================================================
-- 3. Level tag system
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."level_tags" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "color" text DEFAULT '#6b7280' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."level_tags" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."levels_tags" (
    "level_id" bigint NOT NULL,
    "tag_id" integer NOT NULL,
    PRIMARY KEY (level_id, tag_id),
    CONSTRAINT "levels_tags_level_id_fkey"
        FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE CASCADE,
    CONSTRAINT "levels_tags_tag_id_fkey"
        FOREIGN KEY (tag_id) REFERENCES public.level_tags(id) ON DELETE CASCADE
);

ALTER TABLE "public"."levels_tags" OWNER TO "postgres";

-- ============================================================
-- 4. Level variants (low detail versions)
-- ============================================================

-- A variant is a separate level row that is linked to a main level.
-- When a player submits a record with a variant, the record counts
-- for the main level but stores the variant_id for reference.

ALTER TABLE "public"."levels" ADD COLUMN IF NOT EXISTS "main_level_id" bigint;
ALTER TABLE "public"."levels" ADD CONSTRAINT "levels_main_level_id_fkey"
    FOREIGN KEY ("main_level_id") REFERENCES public.levels(id) ON DELETE SET NULL;

-- Add variant_id to records so we know which variant was played
ALTER TABLE "public"."records" ADD COLUMN IF NOT EXISTS "variant_id" bigint;
ALTER TABLE "public"."records" ADD CONSTRAINT "records_variant_id_fkey"
    FOREIGN KEY ("variant_id") REFERENCES public.levels(id) ON DELETE SET NULL;

-- ============================================================
-- 5. Update triggers/functions for the new admin table
-- ============================================================

-- Update the auto_hide function to use the new admin table
CREATE OR REPLACE FUNCTION public.auto_hide_reported_posts()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF (SELECT count(*) FROM public.community_reports WHERE post_id = NEW.post_id AND resolved = false) >= 5 THEN
        UPDATE public.community_posts_admin SET hidden = true WHERE post_id = NEW.post_id;
    END IF;
    RETURN NEW;
END;
$function$;

-- Update the recommended posts function to use the new admin table
CREATE OR REPLACE FUNCTION "public"."get_recommended_community_posts"(
    "p_user_id" "uuid" DEFAULT NULL::"uuid",
    "p_limit" integer DEFAULT 25,
    "p_offset" integer DEFAULT 0,
    "p_type" "text" DEFAULT NULL::"text"
)
RETURNS TABLE(
    "id" integer,
    "uid" "uuid",
    "title" "text",
    "content" "text",
    "type" "text",
    "image_url" "text",
    "video_url" "text",
    "attached_record" "jsonb",
    "attached_level" "jsonb",
    "pinned" boolean,
    "likes_count" integer,
    "comments_count" integer,
    "views_count" integer,
    "is_recommended" boolean,
    "hidden" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "recommendation_score" double precision
)
LANGUAGE plpgsql STABLE
AS $function$
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
            JOIN public.community_posts_admin cpa ON cpa.post_id = cp.id
            WHERE cl.uid = p_user_id
              AND cl.post_id IS NOT NULL
              AND cpa.hidden = false
              AND cpa.moderation_status = 'approved'
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
        pa.hidden,
        p.created_at,
        p.updated_at,
        (
            -- Engagement score
            (p.likes_count * 2.0 + p.comments_count * 3.0 + COALESCE(p.views_count, 0) * 0.1 + 1.0)
            -- Recency multiplier (decays over days)
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
    JOIN public.community_posts_admin pa ON pa.post_id = p.id
    WHERE pa.hidden = false
      AND pa.moderation_status = 'approved'
      AND (p_type IS NULL OR p.type = p_type)
    ORDER BY recommendation_score DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$;

-- Update comment count trigger to work with admin table
CREATE OR REPLACE FUNCTION public.update_community_comment_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
    if (TG_OP = 'INSERT') then
        update public.community_posts set comments_count = comments_count + 1 where id = new.post_id;
    elsif (TG_OP = 'DELETE') then
        update public.community_posts set comments_count = comments_count - 1 where id = old.post_id;
    end if;
    return null;
end;
$function$;

-- Update like count trigger
CREATE OR REPLACE FUNCTION public.update_community_like_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
    if (TG_OP = 'INSERT') then
        if new.post_id is not null then
            update public.community_posts set likes_count = likes_count + 1 where id = new.post_id;
        end if;
        if new.comment_id is not null then
            update public.community_comments set likes_count = likes_count + 1 where id = new.comment_id;
        end if;
    elsif (TG_OP = 'DELETE') then
        if old.post_id is not null then
            update public.community_posts set likes_count = likes_count - 1 where id = old.post_id;
        end if;
        if old.comment_id is not null then
            update public.community_comments set likes_count = likes_count - 1 where id = old.comment_id;
        end if;
    end if;
    return null;
end;
$function$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_admin_status ON public.community_posts_admin(moderation_status);
CREATE INDEX IF NOT EXISTS idx_community_posts_admin_hidden ON public.community_posts_admin(hidden);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags_post_id ON public.community_posts_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags_tag_id ON public.community_posts_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_levels_tags_level_id ON public.levels_tags(level_id);
CREATE INDEX IF NOT EXISTS idx_levels_tags_tag_id ON public.levels_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_levels_main_level_id ON public.levels(main_level_id);
CREATE INDEX IF NOT EXISTS idx_records_variant_id ON public.records(variant_id);

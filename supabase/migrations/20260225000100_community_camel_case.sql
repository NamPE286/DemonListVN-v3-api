BEGIN;

-- ---- Tables ----
ALTER TABLE IF EXISTS public.community_comments RENAME TO "communityComments";
ALTER TABLE IF EXISTS public.community_comments_admin RENAME TO "communityCommentsAdmin";
ALTER TABLE IF EXISTS public.community_likes RENAME TO "communityLikes";
ALTER TABLE IF EXISTS public.community_post_views RENAME TO "communityPostViews";
ALTER TABLE IF EXISTS public.community_posts RENAME TO "communityPosts";
ALTER TABLE IF EXISTS public.community_posts_admin RENAME TO "communityPostsAdmin";
ALTER TABLE IF EXISTS public.community_posts_tags RENAME TO "communityPostsTags";
ALTER TABLE IF EXISTS public.community_reports RENAME TO "communityReports";
ALTER TABLE IF EXISTS public.post_tags RENAME TO "postTags";

-- ---- Columns ----
ALTER TABLE IF EXISTS public."communityComments" RENAME COLUMN attached_level TO "attachedLevel";
ALTER TABLE IF EXISTS public."communityComments" RENAME COLUMN created_at TO "createdAt";
ALTER TABLE IF EXISTS public."communityComments" RENAME COLUMN likes_count TO "likesCount";
ALTER TABLE IF EXISTS public."communityComments" RENAME COLUMN post_id TO "postId";

ALTER TABLE IF EXISTS public."communityCommentsAdmin" RENAME COLUMN comment_id TO "commentId";
ALTER TABLE IF EXISTS public."communityCommentsAdmin" RENAME COLUMN moderation_result TO "moderationResult";
ALTER TABLE IF EXISTS public."communityCommentsAdmin" RENAME COLUMN moderation_status TO "moderationStatus";

ALTER TABLE IF EXISTS public."communityLikes" RENAME COLUMN comment_id TO "commentId";
ALTER TABLE IF EXISTS public."communityLikes" RENAME COLUMN created_at TO "createdAt";
ALTER TABLE IF EXISTS public."communityLikes" RENAME COLUMN post_id TO "postId";

ALTER TABLE IF EXISTS public."communityPostViews" RENAME COLUMN created_at TO "createdAt";
ALTER TABLE IF EXISTS public."communityPostViews" RENAME COLUMN last_viewed_at TO "lastViewedAt";
ALTER TABLE IF EXISTS public."communityPostViews" RENAME COLUMN post_id TO "postId";
ALTER TABLE IF EXISTS public."communityPostViews" RENAME COLUMN view_count TO "viewCount";

ALTER TABLE IF EXISTS public."communityPosts" RENAME COLUMN attached_level TO "attachedLevel";
ALTER TABLE IF EXISTS public."communityPosts" RENAME COLUMN attached_record TO "attachedRecord";
ALTER TABLE IF EXISTS public."communityPosts" RENAME COLUMN comments_count TO "commentsCount";
ALTER TABLE IF EXISTS public."communityPosts" RENAME COLUMN created_at TO "createdAt";
ALTER TABLE IF EXISTS public."communityPosts" RENAME COLUMN image_url TO "imageUrl";
ALTER TABLE IF EXISTS public."communityPosts" RENAME COLUMN is_recommended TO "isRecommended";
ALTER TABLE IF EXISTS public."communityPosts" RENAME COLUMN likes_count TO "likesCount";
ALTER TABLE IF EXISTS public."communityPosts" RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE IF EXISTS public."communityPosts" RENAME COLUMN video_url TO "videoUrl";
ALTER TABLE IF EXISTS public."communityPosts" RENAME COLUMN views_count TO "viewsCount";

ALTER TABLE IF EXISTS public."communityPostsAdmin" RENAME COLUMN moderation_result TO "moderationResult";
ALTER TABLE IF EXISTS public."communityPostsAdmin" RENAME COLUMN moderation_status TO "moderationStatus";
ALTER TABLE IF EXISTS public."communityPostsAdmin" RENAME COLUMN post_id TO "postId";

ALTER TABLE IF EXISTS public."communityPostsTags" RENAME COLUMN post_id TO "postId";
ALTER TABLE IF EXISTS public."communityPostsTags" RENAME COLUMN tag_id TO "tagId";

ALTER TABLE IF EXISTS public."communityReports" RENAME COLUMN comment_id TO "commentId";
ALTER TABLE IF EXISTS public."communityReports" RENAME COLUMN created_at TO "createdAt";
ALTER TABLE IF EXISTS public."communityReports" RENAME COLUMN post_id TO "postId";

ALTER TABLE IF EXISTS public."postTags" RENAME COLUMN admin_only TO "adminOnly";
ALTER TABLE IF EXISTS public."postTags" RENAME COLUMN created_at TO "createdAt";

-- ---- Community functions depending on renamed tables/columns ----
CREATE OR REPLACE FUNCTION public.auto_hide_reported_content()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    report_count integer;
BEGIN
    IF NEW."postId" IS NOT NULL THEN
        SELECT COUNT(*) INTO report_count
        FROM public."communityReports"
        WHERE "postId" = NEW."postId"
          AND resolved = false
          AND "createdAt" > now() - interval '24 hours';

        IF report_count >= 10 THEN
            UPDATE public."communityPosts" SET hidden = true WHERE id = NEW."postId";
        END IF;
    END IF;

    IF NEW."commentId" IS NOT NULL THEN
        SELECT COUNT(*) INTO report_count
        FROM public."communityReports"
        WHERE "commentId" = NEW."commentId"
          AND resolved = false
          AND "createdAt" > now() - interval '24 hours';

        IF report_count >= 10 THEN
            UPDATE public."communityComments" SET hidden = true WHERE id = NEW."commentId";
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_hide_reported_posts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF (SELECT count(*) FROM public."communityReports" WHERE "postId" = NEW."postId" AND resolved = false) >= 5 THEN
        UPDATE public."communityPostsAdmin" SET hidden = true WHERE "postId" = NEW."postId";
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_recommended_community_posts(
    p_user_id uuid DEFAULT NULL::uuid,
    p_limit integer DEFAULT 25,
    p_offset integer DEFAULT 0,
    p_type text DEFAULT NULL::text
) RETURNS TABLE(
    id integer,
    uid uuid,
    title text,
    content text,
    type text,
    "imageUrl" text,
    "videoUrl" text,
    "attachedRecord" jsonb,
    "attachedLevel" jsonb,
    pinned boolean,
    "likesCount" integer,
    "commentsCount" integer,
    "viewsCount" integer,
    "isRecommended" boolean,
    hidden boolean,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "recommendationScore" double precision
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_preferred_types text[];
BEGIN
    IF p_user_id IS NOT NULL THEN
        SELECT ARRAY_AGG(preferred_type)
        INTO v_preferred_types
        FROM (
            SELECT cp.type AS preferred_type
            FROM public."communityLikes" cl
            JOIN public."communityPosts" cp ON cp.id = cl."postId"
            JOIN public."communityPostsAdmin" cpa ON cpa."postId" = cp.id
            WHERE cl.uid = p_user_id
              AND cl."postId" IS NOT NULL
              AND cpa.hidden = false
              AND cpa."moderationStatus" = 'approved'
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
        p."imageUrl",
        p."videoUrl",
        p."attachedRecord",
        p."attachedLevel",
        p.pinned,
        p."likesCount",
        p."commentsCount",
        p."viewsCount",
        p."isRecommended",
        pa.hidden,
        p."createdAt",
        p."updatedAt",
        (
            (CASE WHEN p.pinned THEN 50 ELSE 0 END) +
            (LEAST(p."likesCount", 100) * 1.5) +
            (LEAST(p."commentsCount", 50) * 2.0) +
            (LEAST(p."viewsCount", 500) * 0.1) +
            (CASE
                WHEN p_type IS NOT NULL AND p.type = p_type THEN 20
                WHEN v_preferred_types IS NOT NULL AND p.type = ANY(v_preferred_types) THEN 15
                ELSE 0
             END) +
            (CASE
                WHEN p."createdAt" > now() - interval '1 day' THEN 30
                WHEN p."createdAt" > now() - interval '3 days' THEN 20
                WHEN p."createdAt" > now() - interval '7 days' THEN 10
                ELSE 0
             END)
        )::double precision AS "recommendationScore"
    FROM public."communityPosts" p
    JOIN public."communityPostsAdmin" pa ON pa."postId" = p.id
    WHERE pa.hidden = false
      AND pa."moderationStatus" = 'approved'
      AND (p_type IS NULL OR p.type = p_type)
    ORDER BY "recommendationScore" DESC, p."createdAt" DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_community_post_view(p_user_id uuid, p_post_id integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public."communityPostViews" (uid, "postId", "viewCount", "lastViewedAt")
    VALUES (p_user_id, p_post_id, 1, now())
    ON CONFLICT (uid, "postId")
    DO UPDATE SET
        "viewCount" = "communityPostViews"."viewCount" + 1,
        "lastViewedAt" = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_community_comments_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public."communityPosts" SET "commentsCount" = "commentsCount" + 1 WHERE id = NEW."postId";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public."communityPosts" SET "commentsCount" = "commentsCount" - 1 WHERE id = OLD."postId";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_community_likes_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW."postId" IS NOT NULL THEN
            UPDATE public."communityPosts" SET "likesCount" = "likesCount" + 1 WHERE id = NEW."postId";
        END IF;
        IF NEW."commentId" IS NOT NULL THEN
            UPDATE public."communityComments" SET "likesCount" = "likesCount" + 1 WHERE id = NEW."commentId";
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD."postId" IS NOT NULL THEN
            UPDATE public."communityPosts" SET "likesCount" = "likesCount" - 1 WHERE id = OLD."postId";
        END IF;
        IF OLD."commentId" IS NOT NULL THEN
            UPDATE public."communityComments" SET "likesCount" = "likesCount" - 1 WHERE id = OLD."commentId";
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_community_post_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF (
        OLD.title IS DISTINCT FROM NEW.title OR
        OLD.content IS DISTINCT FROM NEW.content OR
        OLD.type IS DISTINCT FROM NEW.type OR
        OLD."imageUrl" IS DISTINCT FROM NEW."imageUrl" OR
        OLD."videoUrl" IS DISTINCT FROM NEW."videoUrl" OR
        OLD."attachedRecord" IS DISTINCT FROM NEW."attachedRecord" OR
        OLD."attachedLevel" IS DISTINCT FROM NEW."attachedLevel" OR
        OLD."isRecommended" IS DISTINCT FROM NEW."isRecommended"
    ) THEN
        NEW."updatedAt" = now();
    ELSE
        NEW."updatedAt" = OLD."updatedAt";
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_community_post_views_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public."communityPosts"
        SET "viewsCount" = "viewsCount" + 1
        WHERE id = NEW."postId";
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

COMMIT;

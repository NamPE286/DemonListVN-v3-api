ALTER TABLE "public"."communityPosts"
    ADD COLUMN IF NOT EXISTS "attachedList" jsonb;


CREATE INDEX IF NOT EXISTS "community_posts_attached_list_id_idx"
    ON "public"."communityPosts" ((("attachedList" ->> 'id')));
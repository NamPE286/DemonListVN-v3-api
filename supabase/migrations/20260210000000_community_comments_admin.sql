-- Create community_comments_admin table for comment moderation (mirrors community_posts_admin)
CREATE TABLE IF NOT EXISTS "public"."community_comments_admin" (
    "comment_id" integer NOT NULL,
    "moderation_status" "text" DEFAULT 'approved'::"text" NOT NULL,
    "moderation_result" "jsonb",
    "hidden" boolean DEFAULT false NOT NULL,
    CONSTRAINT "community_comments_admin_moderation_status_check" CHECK (("moderation_status" = ANY (ARRAY['approved'::"text", 'pending'::"text", 'rejected'::"text"])))
);

ALTER TABLE "public"."community_comments_admin" OWNER TO "postgres";

ALTER TABLE ONLY "public"."community_comments_admin"
    ADD CONSTRAINT "community_comments_admin_pkey" PRIMARY KEY ("comment_id");

ALTER TABLE ONLY "public"."community_comments_admin"
    ADD CONSTRAINT "community_comments_admin_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."community_comments"("id") ON DELETE CASCADE;

CREATE INDEX "idx_community_comments_admin_status" ON "public"."community_comments_admin" USING "btree" ("moderation_status");
CREATE INDEX "idx_community_comments_admin_hidden" ON "public"."community_comments_admin" USING "btree" ("hidden");

ALTER TABLE "public"."community_comments_admin" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "public"."community_comments_admin" TO "anon";
GRANT ALL ON TABLE "public"."community_comments_admin" TO "authenticated";
GRANT ALL ON TABLE "public"."community_comments_admin" TO "service_role";

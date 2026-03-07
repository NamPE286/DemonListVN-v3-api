-- Add clanId column to communityPosts for clan-scoped community posts
ALTER TABLE "communityPosts"
  ADD COLUMN "clanId" bigint REFERENCES clans(id) ON DELETE CASCADE DEFAULT NULL;

-- Index for efficient filtering of clan posts
CREATE INDEX idx_community_posts_clan_id ON "communityPosts" ("clanId") WHERE "clanId" IS NOT NULL;

-- Index for efficient filtering of global posts (clanId IS NULL)
CREATE INDEX idx_community_posts_global ON "communityPosts" ("clanId") WHERE "clanId" IS NULL;

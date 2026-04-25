-- Add maxParticipants and participantsCount columns to communityPosts
ALTER TABLE "communityPosts"
  ADD COLUMN "maxParticipants" integer DEFAULT NULL,
  ADD COLUMN "participantsCount" integer NOT NULL DEFAULT 0;

-- Create communityPostParticipants table
CREATE TABLE "communityPostParticipants" (
  "id" serial PRIMARY KEY,
  "postId" integer NOT NULL REFERENCES "communityPosts" ("id") ON DELETE CASCADE,
  "uid" uuid NOT NULL REFERENCES "players" ("uid") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected')),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE ("postId", "uid")
);

-- Index for fast lookups
CREATE INDEX idx_community_post_participants_post ON "communityPostParticipants" ("postId");
CREATE INDEX idx_community_post_participants_uid ON "communityPostParticipants" ("uid");
CREATE INDEX idx_community_post_participants_status ON "communityPostParticipants" ("postId", "status");
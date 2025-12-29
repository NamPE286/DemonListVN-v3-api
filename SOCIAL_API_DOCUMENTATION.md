# Social API Documentation

This document describes the social features API endpoints for the DemonListVN v3 platform.

## Overview

The social API provides Twitter-like functionality including:
- Creating, reading, updating, and deleting posts
- Liking and unliking posts
- Commenting on posts
- Reposting content
- Following/unfollowing users
- Feed generation (general and following-only feeds)

## Base URL

All social endpoints are prefixed with `/social`

## Authentication

Most endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Some endpoints work with optional authentication, providing additional data when authenticated.

## Endpoints

### Feed Endpoints

#### GET /social/feed
Get the general post feed (all posts from all users).

**Authentication:** Optional

**Query Parameters:**
- `start` (number, optional): Range start index (default: 0)
- `end` (number, optional): Range end index (default: 20)

**Response:**
```json
[
  {
    "id": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "authorId": "uuid",
    "content": "Post content",
    "imageUrl": "https://example.com/image.jpg",
    "linkEmbed": "https://example.com",
    "isDeleted": false,
    "players": {
      "uid": "uuid",
      "name": "Username",
      "profilepic": "https://example.com/avatar.jpg"
    },
    "postLikes": [{ "count": 10 }],
    "postComments": [{ "count": 5 }],
    "postReposts": [{ "count": 2 }],
    "isLiked": false,
    "isReposted": false
  }
]
```

#### GET /social/feed/following
Get feed from followed users only (requires authentication).

**Authentication:** Required

**Query Parameters:**
- `start` (number, optional): Range start index (default: 0)
- `end` (number, optional): Range end index (default: 20)

**Response:** Same as `/social/feed`

---

### Post Endpoints

#### POST /social/posts
Create a new post.

**Authentication:** Required

**Request Body:**
```json
{
  "content": "Post content",
  "imageUrl": "https://example.com/image.jpg",
  "linkEmbed": "https://example.com/link"
}
```

**Response:**
```json
{
  "id": 1,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "authorId": "uuid",
  "content": "Post content",
  "imageUrl": "https://example.com/image.jpg",
  "linkEmbed": "https://example.com/link",
  "isDeleted": false,
  "players": {
    "uid": "uuid",
    "name": "Username",
    "profilepic": "https://example.com/avatar.jpg"
  }
}
```

#### GET /social/posts/:postId
Get a single post by ID.

**Authentication:** Optional

**Path Parameters:**
- `postId` (number): The ID of the post

**Response:** Single post object with like/comment/repost counts and user interactions

#### PUT /social/posts/:postId
Update a post (only by the author).

**Authentication:** Required

**Path Parameters:**
- `postId` (number): The ID of the post

**Request Body:**
```json
{
  "content": "Updated content",
  "imageUrl": "https://example.com/new-image.jpg",
  "linkEmbed": "https://example.com/new-link"
}
```

**Response:** Updated post object

#### DELETE /social/posts/:postId
Delete a post (soft delete - only by author or admin).

**Authentication:** Required

**Path Parameters:**
- `postId` (number): The ID of the post

**Response:** Empty (200 OK)

---

### Like Endpoints

#### POST /social/posts/:postId/like
Like a post.

**Authentication:** Required

**Path Parameters:**
- `postId` (number): The ID of the post

**Response:** Empty (200 OK)

#### DELETE /social/posts/:postId/like
Unlike a post.

**Authentication:** Required

**Path Parameters:**
- `postId` (number): The ID of the post

**Response:** Empty (200 OK)

#### GET /social/posts/:postId/likes
Get users who liked a post.

**Authentication:** None

**Path Parameters:**
- `postId` (number): The ID of the post

**Query Parameters:**
- `start` (number, optional): Range start index (default: 0)
- `end` (number, optional): Range end index (default: 20)

**Response:**
```json
[
  {
    "userId": "uuid",
    "postId": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "players": {
      "uid": "uuid",
      "name": "Username",
      "profilepic": "https://example.com/avatar.jpg"
    }
  }
]
```

---

### Comment Endpoints

#### POST /social/posts/:postId/comments
Add a comment to a post.

**Authentication:** Required

**Path Parameters:**
- `postId` (number): The ID of the post

**Request Body:**
```json
{
  "content": "Comment content"
}
```

**Response:**
```json
{
  "id": 1,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "postId": 1,
  "authorId": "uuid",
  "content": "Comment content",
  "isDeleted": false,
  "players": {
    "uid": "uuid",
    "name": "Username",
    "profilepic": "https://example.com/avatar.jpg"
  }
}
```

#### GET /social/posts/:postId/comments
Get comments for a post.

**Authentication:** None

**Path Parameters:**
- `postId` (number): The ID of the post

**Query Parameters:**
- `start` (number, optional): Range start index (default: 0)
- `end` (number, optional): Range end index (default: 20)

**Response:** Array of comment objects

#### PUT /social/comments/:commentId
Update a comment (only by the author).

**Authentication:** Required

**Path Parameters:**
- `commentId` (number): The ID of the comment

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

**Response:** Updated comment object

#### DELETE /social/comments/:commentId
Delete a comment (soft delete - only by author or admin).

**Authentication:** Required

**Path Parameters:**
- `commentId` (number): The ID of the comment

**Response:** Empty (200 OK)

---

### Repost Endpoints

#### POST /social/posts/:postId/repost
Repost a post.

**Authentication:** Required

**Path Parameters:**
- `postId` (number): The ID of the post

**Response:** Empty (200 OK)

#### DELETE /social/posts/:postId/repost
Unrepost a post.

**Authentication:** Required

**Path Parameters:**
- `postId` (number): The ID of the post

**Response:** Empty (200 OK)

---

### User-Specific Endpoints

#### GET /social/users/:userId/posts
Get all posts by a specific user.

**Authentication:** Optional

**Path Parameters:**
- `userId` (string): The UID of the user

**Query Parameters:**
- `start` (number, optional): Range start index (default: 0)
- `end` (number, optional): Range end index (default: 20)

**Response:** Array of post objects

#### GET /social/users/:userId/reposts
Get all reposts by a specific user.

**Authentication:** Optional

**Path Parameters:**
- `userId` (string): The UID of the user

**Query Parameters:**
- `start` (number, optional): Range start index (default: 0)
- `end` (number, optional): Range end index (default: 20)

**Response:**
```json
[
  {
    "id": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "userId": "uuid",
    "postId": 1,
    "posts": {
      "id": 1,
      "content": "Original post content",
      "players": {
        "uid": "uuid",
        "name": "Original Author",
        "profilepic": "https://example.com/avatar.jpg"
      },
      "postLikes": [{ "count": 10 }],
      "postComments": [{ "count": 5 }],
      "postReposts": [{ "count": 2 }],
      "isLiked": false,
      "isReposted": true
    }
  }
]
```

---

### Follow Endpoints

#### POST /social/users/:userId/follow
Follow a user.

**Authentication:** Required

**Path Parameters:**
- `userId` (string): The UID of the user to follow

**Response:** Empty (200 OK)

**Note:** Users cannot follow themselves.

#### DELETE /social/users/:userId/follow
Unfollow a user.

**Authentication:** Required

**Path Parameters:**
- `userId` (string): The UID of the user to unfollow

**Response:** Empty (200 OK)

#### GET /social/users/:userId/followers
Get a user's followers.

**Authentication:** None

**Path Parameters:**
- `userId` (string): The UID of the user

**Query Parameters:**
- `start` (number, optional): Range start index (default: 0)
- `end` (number, optional): Range end index (default: 20)

**Response:**
```json
[
  {
    "followerId": "uuid",
    "followingId": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "players": {
      "uid": "uuid",
      "name": "Follower Name",
      "profilepic": "https://example.com/avatar.jpg"
    }
  }
]
```

#### GET /social/users/:userId/following
Get users that a user is following.

**Authentication:** None

**Path Parameters:**
- `userId` (string): The UID of the user

**Query Parameters:**
- `start` (number, optional): Range start index (default: 0)
- `end` (number, optional): Range end index (default: 20)

**Response:**
```json
[
  {
    "followerId": "uuid",
    "followingId": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "players": {
      "uid": "uuid",
      "name": "Following Name",
      "profilepic": "https://example.com/avatar.jpg"
    }
  }
]
```

#### GET /social/users/:userId/follow-stats
Get follow statistics for a user (follower and following counts).

**Authentication:** None

**Path Parameters:**
- `userId` (string): The UID of the user

**Response:**
```json
{
  "followers": 100,
  "following": 50
}
```

#### GET /social/users/:userId/is-following/:targetUserId
Check if a user is following another user.

**Authentication:** None

**Path Parameters:**
- `userId` (string): The UID of the follower
- `targetUserId` (string): The UID of the user being checked

**Response:**
```json
{
  "isFollowing": true
}
```

---

## Database Schema

### Tables

#### posts
Stores all user posts.

- `id` (bigint, PK): Post ID
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp
- `authorId` (uuid, FK): Reference to players.uid
- `content` (text): Post content
- `imageUrl` (text, nullable): Optional image URL
- `linkEmbed` (text, nullable): Optional link embed
- `isDeleted` (boolean): Soft delete flag

#### postLikes
Tracks post likes.

- `userId` (uuid, FK, PK): Reference to players.uid
- `postId` (bigint, FK, PK): Reference to posts.id
- `created_at` (timestamp): Like timestamp

#### postComments
Stores comments on posts.

- `id` (bigint, PK): Comment ID
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp
- `postId` (bigint, FK): Reference to posts.id
- `authorId` (uuid, FK): Reference to players.uid
- `content` (text): Comment content
- `isDeleted` (boolean): Soft delete flag

#### postReposts
Tracks post reposts.

- `id` (bigint, PK): Repost ID
- `created_at` (timestamp): Repost timestamp
- `userId` (uuid, FK): Reference to players.uid
- `postId` (bigint, FK): Reference to posts.id
- Unique constraint on (userId, postId)

#### userFollows
Tracks user follow relationships.

- `followerId` (uuid, FK, PK): Reference to players.uid (the follower)
- `followingId` (uuid, FK, PK): Reference to players.uid (being followed)
- `created_at` (timestamp): Follow timestamp
- Check constraint: followerId != followingId

---

## Error Responses

All endpoints may return the following error codes:

- `400 Bad Request`: Invalid input (e.g., missing required fields)
- `401 Unauthorized`: Authentication required but not provided or invalid
- `403 Forbidden`: Authenticated but not authorized for the action
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "message": "Error description"
}
```

---

## Integration with Player Profiles

The social features integrate with existing player profiles through the `/players/:uid` endpoints. Players can now have:

1. **Posts Tab**: View a player's posts at `/social/users/:userId/posts`
2. **Reposts Tab**: View a player's reposts at `/social/users/:userId/reposts`
3. **Social Stats**: View follower/following counts at `/social/users/:userId/follow-stats`
4. **Follow Button**: Follow/unfollow using `/social/users/:userId/follow`

---

## Usage Examples

### Create a Post with Image
```bash
curl -X POST https://api.example.com/social/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check out this cool level!",
    "imageUrl": "https://example.com/level-screenshot.jpg"
  }'
```

### Get User's Posts
```bash
curl https://api.example.com/social/users/USER_UUID/posts?start=0&end=20
```

### Like a Post
```bash
curl -X POST https://api.example.com/social/posts/123/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Follow a User
```bash
curl -X POST https://api.example.com/social/users/USER_UUID/follow \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Following Feed
```bash
curl https://api.example.com/social/feed/following?start=0&end=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

- All timestamps are in ISO 8601 format with timezone
- Pagination uses range-based indexing (start, end)
- Soft deletes are used for posts and comments (isDeleted flag)
- Row Level Security (RLS) is enabled on all tables
- Cascade deletes are configured for foreign key relationships
- Indexes are created for optimal query performance

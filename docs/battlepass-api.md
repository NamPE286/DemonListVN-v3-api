# Battle Pass API Documentation

This document provides a complete reference for the Battle Pass, Map Pack, Missions, and Subscriptions API endpoints.

## Base URL

All endpoints are prefixed with `/battlepass`

## Authentication

- 🔓 Public - No authentication required
- 🔐 User Auth - Requires `Authorization: Bearer <token>` header
- 🔑 Admin Only - Requires admin authentication

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `battlePassSeasons` | 15-week seasons with premium pricing (149k/season) |
| `battlePassLevels` | Links season to GD levels (Extreme Demons, 3/season, 1000 XP each) |
| `mapPacks` | General reusable map packs (name, difficulty, xp) |
| `mapPackLevels` | Levels within map packs (3-5 levels per pack) |
| `battlePassMapPacks` | Links season to map packs (12/season, weekly unlock) |
| `battlePassProgress` | Player XP per season |
| `battlePassLevelProgress` | Player progress on battle pass levels |
| `battlePassMapPackProgress` | Player progress on battle pass map packs |
| `battlePassTierRewards` | Tier rewards configuration (Basic/Premium) |
| `battlePassRewardClaims` | Tracks claimed tier rewards |
| `battlePassMissions` | Missions with JSONB condition |
| `battlePassMissionRewards` | Item rewards for completing missions |
| `battlePassMissionClaims` | Tracks claimed mission rewards |
| `battlePassMissionProgress` | Tracks mission completion status |
| `subscriptions` | Subscription types (name, type, price) |
| `playerSubscriptions` | Player subscriptions with refId and nullable end date |

### Core Constants

```typescript
const XP_PER_TIER = 100;     // 100 XP per tier
const MAX_TIER = 100;        // 100 tiers maximum
```

---

## Season Endpoints

### GET `/battlepass` 🔓

Get the currently active battle pass season.

**Response:**
```json
{
  "id": 1,
  "created_at": "2026-01-15T00:00:00Z",
  "title": "Season 1: Genesis",
  "description": "The first battle pass season",
  "start": "2026-01-15T00:00:00Z",
  "end": "2026-04-30T00:00:00Z",
  "isArchived": false,
  "premiumPrice": 149000
}
```

### GET `/battlepass/season/:id` 🔓

Get a specific season by ID.

**Response:** Same as above

### POST `/battlepass/season` 🔑

Create a new battle pass season.

**Request Body:**
```json
{
  "title": "Season 2: Legends",
  "description": "The second battle pass season",
  "start": "2026-05-01T00:00:00Z",
  "end": "2026-08-15T00:00:00Z"
}
```

**Response:** Created season object

### PATCH `/battlepass/season/:id` 🔑

Update a season.

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

### POST `/battlepass/season/:id/archive` 🔑

Archive a season.

---

## Progress Endpoints

### GET `/battlepass/progress` 🔐

Get current user's battle pass progress for the active season.

**Response:**
```json
{
  "seasonId": 1,
  "userID": "uuid-here",
  "xp": 2500,
  "isPremium": true,
  "tier": 25
}
```

### GET `/battlepass/progress/:seasonId` 🔐

Get user's progress for a specific season.

**Response:** Same as above

### POST `/battlepass/upgrade` 🔑

Upgrade a user to premium battle pass (called after payment verification).

**Request Body:**
```json
{
  "seasonId": 1,
  "userId": "user-uuid-here"
}
```

### POST `/battlepass/xp/add` 🔑

Add XP to a user manually.

**Request Body:**
```json
{
  "seasonId": 1,
  "userId": "user-uuid-here",
  "xp": 500
}
```

**Response:**
```json
{
  "previousXp": 2000,
  "newXp": 2500,
  "previousTier": 20,
  "newTier": 25
}
```

---

## Level Endpoints

### GET `/battlepass/levels` 🔓

Get active season's battle pass levels.

**Response:**
```json
[
  {
    "id": 1,
    "created_at": "2026-01-15T00:00:00Z",
    "seasonId": 1,
    "levelID": 12345678,
    "xp": 1000,
    "minProgressXp": 500,
    "minProgress": 50,
    "levels": {
      "id": 12345678,
      "name": "Extreme Level Name",
      "difficulty": "extreme_demon"
    }
  }
]
```

### GET `/battlepass/season/:id/levels` 🔓

Get levels for a specific season.

### POST `/battlepass/season/:id/levels` 🔑

Add a level to a season.

**Request Body:**
```json
{
  "levelID": 12345678,
  "xp": 1000,
  "minProgressXp": 500,
  "minProgress": 50
}
```

### PATCH `/battlepass/level/:levelId` 🔑

Update a season level.

### DELETE `/battlepass/level/:levelId` 🔑

Delete a season level.

### GET `/battlepass/levels/:levelId/progress` 🔐

Get user's progress on a specific battle pass level.

**Response:**
```json
{
  "progress": 75,
  "minProgressClaimed": true,
  "completionClaimed": false
}
```

### PUT `/battlepass/levels/:levelId/progress?p=100` 🔐

Update level progress. This endpoint also:
- Updates map pack progress for any map packs containing the level
- Checks and marks missions as completed if conditions are met

**Query Parameters:**
- `p` (required): Progress percentage (0-100)

**Response:**
```json
{
  "battlePassLevelId": 1,
  "progress": 100
}
```

---

## Map Pack Endpoints

### GET `/battlepass/mappacks` 🔓

Get active season's unlocked map packs (based on week since season start).

**Response:**
```json
[
  {
    "id": 1,
    "created_at": "2026-01-15T00:00:00Z",
    "seasonId": 1,
    "mapPackId": 1,
    "unlockWeek": 1,
    "order": 0,
    "mapPacks": {
      "id": 1,
      "name": "Harder Pack 1",
      "description": "A collection of harder levels",
      "difficulty": "harder",
      "xp": 200,
      "mapPackLevels": [
        {
          "id": 1,
          "levelID": 11111111,
          "order": 0,
          "levels": {
            "id": 11111111,
            "name": "Level Name"
          }
        }
      ]
    }
  }
]
```

### GET `/battlepass/season/:id/mappacks` 🔓/🔑

Get map packs for a season. Admin users get all packs, regular users get only unlocked ones.

### POST `/battlepass/season/:id/mappacks` 🔑

Link a map pack to a season.

**Request Body:**
```json
{
  "mapPackId": 1,
  "unlockWeek": 3,
  "order": 0
}
```

### GET `/battlepass/mappack/:mapPackId` 🔓

Get a specific battle pass map pack.

### PATCH `/battlepass/mappack/:mapPackId` 🔑

Update a battle pass map pack.

### DELETE `/battlepass/mappack/:mapPackId` 🔑

Delete a battle pass map pack.

### GET `/battlepass/mappack/:mapPackId/progress` 🔐

Get user's progress on a map pack.

**Response:**
```json
{
  "battlePassMapPackId": 1,
  "userID": "user-uuid",
  "completedLevels": [11111111, 22222222],
  "claimed": false
}
```

### POST `/battlepass/mappack/:mapPackId/claim` 🔐

Claim XP reward for completing a map pack.

**Response:**
```json
{
  "xp": 500
}
```

**Error Responses:**
- `400`: "Already claimed" or "Map pack not completed"

---

## General Map Pack Endpoints

These endpoints manage map packs globally (not specific to battle pass seasons).

### GET `/battlepass/mappacks/general` 🔓

Get all map packs.

**Response:**
```json
[
  {
    "id": 1,
    "created_at": "2026-01-15T00:00:00Z",
    "name": "Harder Pack 1",
    "description": "A collection of harder levels",
    "difficulty": "harder",
    "xp": 200,
    "mapPackLevels": [
      {
        "id": 1,
        "mapPackId": 1,
        "levelID": 11111111,
        "order": 0,
        "levels": {
          "id": 11111111,
          "name": "Level Name"
        }
      }
    ]
  }
]
```

### POST `/battlepass/mappacks/general` 🔑

Create a new map pack.

**Request Body:**
```json
{
  "name": "Demon Pack 1",
  "description": "A collection of medium demon levels",
  "difficulty": "medium_demon",
  "xp": 500
}
```

**Difficulty Options:** `easier`, `harder`, `medium_demon`, `insane_demon`

### GET `/battlepass/mappacks/general/:mapPackId` 🔓

Get a specific map pack.

### PATCH `/battlepass/mappacks/general/:mapPackId` 🔑

Update a map pack.

### DELETE `/battlepass/mappacks/general/:mapPackId` 🔑

Delete a map pack.

### POST `/battlepass/mappacks/general/:mapPackId/level` 🔑

Add a level to a map pack.

**Request Body:**
```json
{
  "levelID": 12345678,
  "order": 0
}
```

### DELETE `/battlepass/mappacks/general/:mapPackId/level/:levelId` 🔑

Remove a level from a map pack.

---

## Tier Rewards Endpoints

### GET `/battlepass/rewards` 🔓

Get active season's tier rewards.

**Response:**
```json
[
  {
    "id": 1,
    "created_at": "2026-01-15T00:00:00Z",
    "seasonId": 1,
    "tier": 15,
    "isPremium": false,
    "itemId": 101,
    "quantity": 1,
    "description": "Basic Crate",
    "items": {
      "id": 101,
      "name": "Basic Crate"
    }
  }
]
```

### GET `/battlepass/season/:id/rewards` 🔓

Get tier rewards for a specific season.

### POST `/battlepass/season/:id/rewards` 🔑

Create a tier reward.

**Request Body:**
```json
{
  "tier": 25,
  "isPremium": true,
  "itemId": 102,
  "quantity": 1,
  "description": "Premium Crate"
}
```

### DELETE `/battlepass/reward/:rewardId` 🔑

Delete a tier reward.

### POST `/battlepass/reward/:rewardId/claim` 🔐

Claim a tier reward.

**Response:**
```json
{
  "id": 1,
  "tier": 15,
  "isPremium": false,
  "itemId": 101,
  "quantity": 1
}
```

**Error Responses:**
- `400`: "Already claimed", "Tier not reached", or "Premium required"

### GET `/battlepass/rewards/claimable` 🔐

Get all claimable rewards for the current user.

**Response:**
```json
[
  {
    "id": 1,
    "tier": 15,
    "isPremium": false,
    "itemId": 101,
    "quantity": 1,
    "description": "Basic Crate"
  }
]
```

---

## Mission Endpoints

### GET `/battlepass/missions` 🔐

Get active season's missions with user completion status.

**Response:**
```json
[
  {
    "id": 1,
    "seasonId": 1,
    "title": "Beat Extreme Level",
    "description": "Complete the featured extreme demon",
    "condition": [
      {"type": "clear_level", "targetId": 12345678}
    ],
    "xp": 500,
    "order": 0,
    "completed": true,
    "claimed": false,
    "battlePassMissionRewards": [
      {
        "id": 1,
        "itemId": 103,
        "quantity": 1,
        "expireAfter": 7
      }
    ]
  }
]
```

### GET `/battlepass/season/:id/missions` 🔓

Get all missions for a specific season.

### POST `/battlepass/season/:id/missions` 🔑

Create a mission.

**Request Body:**
```json
{
  "title": "Clear 5 Levels",
  "description": "Beat any 5 battle pass levels",
  "condition": [
    {"type": "clear_level_count", "value": 5}
  ],
  "xp": 300,
  "order": 0
}
```

**Condition Types:**
```json
[
  {"type": "clear_level", "targetId": 123},        // Clear specific level
  {"type": "clear_mappack", "targetId": 456},      // Clear specific map pack
  {"type": "reach_tier", "value": 50},             // Reach tier 50
  {"type": "earn_xp", "value": 1000},              // Earn 1000 XP
  {"type": "clear_level_count", "value": 5},       // Clear any 5 levels
  {"type": "clear_mappack_count", "value": 3}      // Clear any 3 map packs
]
```

### GET `/battlepass/mission/:missionId` 🔓

Get a specific mission.

### PATCH `/battlepass/mission/:missionId` 🔑

Update a mission.

### DELETE `/battlepass/mission/:missionId` 🔑

Delete a mission.

### POST `/battlepass/mission/:missionId/claim` 🔐

Claim a completed mission reward.

**Response:**
```json
{
  "id": 1,
  "title": "Beat Extreme Level",
  "xp": 500,
  "rewards": [
    {
      "itemId": 103,
      "quantity": 1
    }
  ]
}
```

**Error Responses:**
- `400`: "Already claimed" or "Mission not completed"

### POST `/battlepass/mission/:missionId/reward` 🔑

Add a reward item to a mission.

**Request Body:**
```json
{
  "itemId": 103,
  "quantity": 1,
  "expireAfter": 7
}
```

### DELETE `/battlepass/mission/:missionId/reward/:rewardId` 🔑

Remove a reward from a mission.

---

## Subscriptions

Premium status is tracked via the `playerSubscriptions` table, which has:
- `subscriptionId`: Links to subscription type
- `refId`: Can point to battle pass season ID
- `end`: Nullable (null = permanent purchase)

To check if a user has premium battle pass:
```typescript
// In service code
const isPremium = await hasBattlePassPremium(userId, seasonId);
```

The `getPlayerProgress` endpoint automatically computes `isPremium` from subscriptions.

---

## Workflow Examples

### User Progressing Through Battle Pass

1. **Get active season:** `GET /battlepass`
2. **Get user progress:** `GET /battlepass/progress`
3. **Get levels and map packs:**
   - `GET /battlepass/levels`
   - `GET /battlepass/mappacks`
4. **Update level progress:** `PUT /battlepass/levels/123/progress?p=100`
   - This automatically updates map pack progress
   - This automatically checks and completes missions
5. **Claim map pack reward:** `POST /battlepass/mappack/1/claim`
6. **Get claimable tier rewards:** `GET /battlepass/rewards/claimable`
7. **Claim tier reward:** `POST /battlepass/reward/5/claim`
8. **Get missions and claim:** 
   - `GET /battlepass/missions`
   - `POST /battlepass/mission/1/claim`

### Admin Creating Season Content

1. **Create season:** `POST /battlepass/season`
2. **Create map packs:** `POST /battlepass/mappacks/general`
3. **Add levels to map packs:** `POST /battlepass/mappacks/general/1/level`
4. **Link map packs to season:** `POST /battlepass/season/1/mappacks`
5. **Add battle pass levels:** `POST /battlepass/season/1/levels`
6. **Create tier rewards:** `POST /battlepass/season/1/rewards`
7. **Create missions:** `POST /battlepass/season/1/missions`
8. **Add mission rewards:** `POST /battlepass/mission/1/reward`

---

## XP and Tier Calculation

- **100 XP per tier** (constant: `XP_PER_TIER = 100`)
- **100 maximum tiers** (constant: `MAX_TIER = 100`)
- Tier calculation: `Math.min(Math.floor(xp / 100), 100)`

### XP Sources

| Source | XP Amount |
|--------|-----------|
| Battle Pass Level (complete) | 1000 XP |
| Battle Pass Level (min progress) | 500 XP |
| Map Pack (Harder or easier) | 200 XP |
| Map Pack (Medium Demon) | 500 XP |
| Map Pack (Insane Demon) | 1000 XP |
| Missions | Variable (set per mission) |
| In-game Daily Level | 25 XP |
| In-game Weekly Demon | 100 XP |

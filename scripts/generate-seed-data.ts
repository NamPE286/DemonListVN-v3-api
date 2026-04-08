/**
 * Seed Data Generator
 *
 * Fetches data from the production Supabase database and generates a seed.sql file
 * with anonymized/fake data for sensitive fields.
 *
 * Usage:
 *   SUPABASE_API_URL=<url> SUPABASE_API_KEY=<service_role_key> npx tsx scripts/generate-seed-data.ts
 *
 * Environment variables:
 *   SUPABASE_API_URL  - Production Supabase URL
 *   SUPABASE_API_KEY  - Production Supabase service role key
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/supabase";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_API_URL;
const SUPABASE_KEY = process.env.SUPABASE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Error: SUPABASE_API_URL and SUPABASE_API_KEY env vars are required."
  );
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

const MIN_ROWS = 10;
const OUTPUT_PATH = resolve(import.meta.dirname!, "..", "supabase", "seed.sql");

// ---------------------------------------------------------------------------
// Fake data helpers
// ---------------------------------------------------------------------------

let fakeCounter = 0;

function fakeEmail(index: number): string {
  return `user${index}@example.com`;
}

function fakeName(index: number): string {
  const names = [
    "Player_Alpha",
    "Player_Beta",
    "Player_Gamma",
    "Player_Delta",
    "Player_Epsilon",
    "Player_Zeta",
    "Player_Eta",
    "Player_Theta",
    "Player_Iota",
    "Player_Kappa",
    "Player_Lambda",
    "Player_Mu",
    "Player_Nu",
    "Player_Xi",
    "Player_Omicron",
  ];
  return names[index % names.length]!;
}

function fakePhone(): number {
  return 1000000000 + Math.floor(Math.random() * 9000000000);
}

function fakeAddress(): string {
  const streets = [
    "123 Main St",
    "456 Oak Ave",
    "789 Pine Rd",
    "321 Elm Blvd",
    "654 Cedar Ln",
    "111 Maple Dr",
    "222 Birch Way",
    "333 Walnut Ct",
    "444 Cherry Pl",
    "555 Spruce St",
  ];
  return streets[Math.floor(Math.random() * streets.length)]!;
}

function fakeDiscord(index: number): string {
  return `fakeuser${index}#0000`;
}

function fakeFacebook(index: number): string {
  return `https://www.facebook.com/profile.php?id=10000000000${index}`;
}

function fakeYoutube(index: number): string {
  return `https://www.youtube.com/@fakeuser${index}`;
}

function fakePointercrate(index: number): string {
  return `fakeuser${index}`;
}

function fakeApiKey(): string {
  return `fake_key_${crypto.randomBytes(16).toString("hex")}`;
}

function fakeOtpCode(): string {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function fakeCouponCode(index: number): string {
  return `FAKECOUPON${index}`;
}

function fakeSocialId(platform: string, index: number): string {
  switch (platform) {
    case "discord":
      return `${100000000000000000n + BigInt(index)}`;
    case "facebook":
      return `10000000000${index}`;
    case "youtube":
      return `UC${crypto.randomBytes(11).toString("base64url").slice(0, 22)}`;
    default:
      return `social_id_${index}`;
  }
}

function fakeSocialName(platform: string, index: number): string {
  switch (platform) {
    case "discord":
      return `FakeUser${index}#0000`;
    case "facebook":
      return `https://www.facebook.com/profile.php?id=10000000000${index}`;
    case "youtube":
      return `https://www.youtube.com/@fakeuser${index}`;
    default:
      return `social_user_${index}`;
  }
}

// ---------------------------------------------------------------------------
// UID mapping – keep consistent fake UIDs across tables
// ---------------------------------------------------------------------------

const uidMap = new Map<string, string>();
let uidCounter = 0;

const UUID_COLUMN_NAMES = new Set([
  "uid",
  "userID",
  "userid",
  "userId",
  "owner",
  "host",
  "player",
  "to",
  "openerId",
  "reviewer",
  "creatorId",
  "granted_by",
  "giftTo",
]);

const POSTGRES_ARRAY_COLUMNS = new Set([
  "heatmap.days",
  "deathCount.count",
  "levelDeathCount.count",
]);

function mapUid(realUid: string): string {
  if (!uidMap.has(realUid)) {
    uidCounter++;
    uidMap.set(
      realUid,
      `00000000-0000-0000-0000-${String(uidCounter).padStart(12, "0")}`
    );
  }
  return uidMap.get(realUid)!;
}

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

function isUuidString(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    val
  );
}

function escSqlArray(values: unknown[]): string {
  const escapedValues = values.map((value) => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    if (typeof value === "number") return String(value);
    return `'${String(value).replace(/'/g, "''")}'`;
  });

  return `ARRAY[${escapedValues.join(", ")}]`;
}

function escSql(val: unknown, tableName: string, columnName?: string): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);

  if (
    Array.isArray(val) &&
    columnName &&
    POSTGRES_ARRAY_COLUMNS.has(`${tableName}.${columnName}`)
  ) {
    return escSqlArray(val);
  }

  if (typeof val === "object") {
    // JSON objects / JSON arrays
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }

  const escaped = String(val).replace(/'/g, "''");

  if (columnName && UUID_COLUMN_NAMES.has(columnName) && isUuidString(String(val))) {
    return `'${escaped}'::uuid`;
  }

  return `'${escaped}'`;
}

function insertStatement(table: string, columns: string[], rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const colList = columns.map((c) => `"${c}"`).join(", ");
  const valueRows = rows.map((row) => {
    const vals = columns.map((c) => escSql(row[c], table, c));
    return `  (${vals.join(", ")})`;
  });
  return `INSERT INTO "public"."${table}" (${colList}) VALUES\n${valueRows.join(",\n")}\nON CONFLICT DO NOTHING;\n`;
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function fetchTable(
  table: string,
  limit = MIN_ROWS,
  orderCol = "created_at"
): Promise<Record<string, unknown>[]> {
  // Try ordering by the given column; fall back to no order
  const { data, error } = await (supabase as any)
    .from(table)
    .select("*")
    .order(orderCol, { ascending: false })
    .limit(limit);

  if (error) {
    // Retry without order if the column doesn't exist
    const retry = await (supabase as any).from(table).select("*").limit(limit);
    if (retry.error) {
      console.warn(`  ⚠ Could not fetch "${table}": ${retry.error.message}`);
      return [];
    }
    return (retry.data ?? []) as Record<string, unknown>[];
  }
  return (data ?? []) as Record<string, unknown>[];
}

// ---------------------------------------------------------------------------
// Anonymizers per table
// ---------------------------------------------------------------------------

type Anonymizer = (row: Record<string, unknown>, index: number) => Record<string, unknown>;

function anonymizePlayers(row: Record<string, unknown>, i: number): Record<string, unknown> {
  return {
    ...row,
    uid: mapUid(row.uid as string),
    name: fakeName(i),
    email: fakeEmail(i),
    discord: fakeDiscord(i),
    facebook: fakeFacebook(i),
    youtube: fakeYoutube(i),
    province: null,
    city: null,
    DiscordDMChannelID: null,
    overviewData: null,
    pointercrate: fakePointercrate(i),
  };
}

function anonymizeOrders(row: Record<string, unknown>, i: number): Record<string, unknown> {
  return {
    ...row,
    userID: mapUid(row.userID as string),
    giftTo: row.giftTo ? mapUid(row.giftTo as string) : null,
    address: row.address ? fakeAddress() : null,
    phone: row.phone ? fakePhone() : null,
    recipientName: row.recipientName ? `Recipient ${i}` : null,
    data: null,
    coupon: null, // remove FK reference to avoid conflict
  };
}

function anonymizeApiKey(row: Record<string, unknown>, _i: number): Record<string, unknown> {
  return {
    ...row,
    uid: mapUid(row.uid as string),
    key: fakeApiKey(),
  };
}

function anonymizeOtp(row: Record<string, unknown>, _i: number): Record<string, unknown> {
  return {
    ...row,
    granted_by: row.granted_by ? mapUid(row.granted_by as string) : null,
    code: fakeOtpCode(),
    is_expired: true,
  };
}

function anonymizeCoupons(row: Record<string, unknown>, i: number): Record<string, unknown> {
  return {
    ...row,
    owner: row.owner ? mapUid(row.owner as string) : null,
    code: fakeCouponCode(i),
  };
}

function anonymizeUserSocial(row: Record<string, unknown>, i: number): Record<string, unknown> {
  return {
    ...row,
    userid: mapUid(row.userid as string),
    id: fakeSocialId(row.platform as string, i),
    name: fakeSocialName(row.platform as string, i),
  };
}

function keepOriginalRow(row: Record<string, unknown>): Record<string, unknown> {
  return { ...row };
}

/** Default anonymizer – only remaps uid-like columns */
function anonymizeDefault(row: Record<string, unknown>, _i: number): Record<string, unknown> {
  const copy = { ...row };
  // Remap all uid foreign keys
  for (const key of [
    "uid",
    "userID",
    "userid",
    "userId",
    "owner",
    "host",
    "player",
    "to",
    "openerId",
    "reviewer",
    "creatorId",
    "granted_by",
  ]) {
    if (copy[key] && typeof copy[key] === "string") {
      copy[key] = mapUid(copy[key] as string);
    }
  }
  return copy;
}

// ---------------------------------------------------------------------------
// Table definitions: which tables to seed, column order, and anonymizers
// ---------------------------------------------------------------------------

interface TableDef {
  name: string;
  /** Column names to include (in insert order) */
  columns: string[];
  /** Optional anonymizer; defaults to anonymizeDefault */
  anonymize?: Anonymizer;
  /** Column to ORDER BY DESC when fetching; defaults to "created_at" */
  orderCol?: string;
  /** Number of rows to fetch; defaults to MIN_ROWS */
  limit?: number;
}

// We seed tables in FK-dependency order so inserts succeed.
const TABLE_DEFS: TableDef[] = [
  // ── Independent / root tables ──────────────────────────────────────────
  {
    name: "products",
    columns: [
      "id", "name", "description", "price", "featured", "hidden",
      "bannerTextColor", "imgCount", "maxQuantity", "redirect", "stock", "created_at",
    ],
  },
  {
    name: "subscriptions",
    columns: ["id", "name", "description", "price", "type", "refId", "created_at"],
  },
  {
    name: "levelTags",
    columns: ["id", "name", "color", "created_at"],
  },
  {
    name: "postTags",
    columns: ["id", "name", "color", "adminOnly", "createdAt"],
    orderCol: "createdAt",
  },
  {
    name: "rules",
    columns: ["type", "lang", "content"],
    orderCol: "type",
  },
  {
    name: "wiki",
    columns: ["path", "locale", "title", "description", "image", "modifiedAt", "created_at"],
  },
  {
    name: "mapPacks",
    columns: ["id", "name", "description", "difficulty", "xp", "created_at"],
  },

  // ── Players (core entity) ──────────────────────────────────────────────
  {
    name: "players",
    columns: [
      "uid", "id", "name", "email", "discord", "facebook", "youtube",
      "province", "city", "DiscordDMChannelID", "overviewData", "pointercrate",
      "avatarVersion", "bannerVersion", "bgColor", "borderColor",
      "clan", "clrank", "clRating", "dlMaxPt", "dlrank", "elo", "exp",
      "extraExp", "flMaxPt", "flrank", "isAdmin", "isAvatarGif",
      "isBanned", "isBannerGif", "isHidden", "isTrusted", "matchCount",
      "nameLocked", "overallRank", "overwatchReviewCount",
      "overwatchReviewDate", "plrank", "plRating", "rating",
      "recordCount", "renameCooldown", "reviewCooldown",
      "supporterUntil", "totalDLpt", "totalFLpt",
    ],
    anonymize: anonymizePlayers,
    orderCol: "id",
    limit: 15, // extra to ensure downstream FKs have enough targets
  },

  // ── Items (needed before inventory, caseItems, etc.) ───────────────────
  {
    name: "items",
    columns: [
      "id", "name", "description", "type", "rarity", "quantity",
      "stackable", "productId", "redirect", "defaultExpireAfter",
    ],
    orderCol: "id",
  },

  // ── Levels ─────────────────────────────────────────────────────────────
  {
    name: "levels",
    columns: [
      "id", "name", "creator", "creatorId", "difficulty", "dlTop",
      "flPt", "flTop", "insaneTier", "isChallenge", "isNonList",
      "isPlatformer", "main_level_id", "minProgress", "rating",
      "videoID", "accepted", "created_at",
    ],
    anonymize: keepOriginalRow,
    orderCol: "id",
    limit: 50,
  },

  // ── Clans ──────────────────────────────────────────────────────────────
  {
    name: "clans",
    columns: [
      "id", "name", "tag", "owner", "rating", "rank",
      "memberCount", "memberLimit", "isPublic", "mode",
      "imageVersion", "tagBgColor", "tagTextColor",
      "homeContent", "boostedUntil", "created_at",
    ],
    orderCol: "id",
  },

  // ── Events ─────────────────────────────────────────────────────────────
  {
    name: "events",
    columns: [
      "id", "title", "description", "content", "type", "start", "end",
      "freeze", "hidden", "imgUrl", "isCalculated", "isContest",
      "isExternal", "isRanked", "isSupporterOnly", "minExp",
      "needProof", "priority", "redirect", "exp", "data", "created_at",
    ],
  },

  // ── Pass Seasons ────────────────────────────────────────────────
  {
    name: "battlePassCourses",
    columns: ["id", "title", "description", "created_at"],
  },
  {
    name: "battlePassSeasons",
    columns: [
      "id", "title", "description", "start", "end",
      "isArchived", "primaryColor", "courseId", "created_at",
    ],
  },

  // ── FK-dependent tables ────────────────────────────────────────────────
  {
    name: "records",
    columns: [
      "userid", "levelid", "progress", "videoLink", "mobile",
      "needMod", "isChecked", "dlPt", "flPt", "clPt", "plPt",
      "comment", "raw", "refreshRate", "reviewer", "reviewerComment",
      "suggestedRating", "timestamp", "prioritizedBy", "no", "queueNo",
      "variant_id",
    ],
    orderCol: "timestamp",
  },
  {
    name: "levels_tags",
    columns: ["level_id", "tag_id"],
    orderCol: "level_id",
  },
  {
    name: "mapPackLevels",
    columns: ["id", "mapPackId", "levelID", "order", "created_at"],
  },
  {
    name: "levelGDStates",
    columns: ["levelId", "isDaily", "isWeekly"],
    orderCol: "levelId",
  },
  {
    name: "changelogs",
    columns: ["id", "levelID", "old", "new", "published", "created_at"],
  },
  {
    name: "inventory",
    columns: [
      "id", "userID", "itemId", "quantity", "consumed",
      "content", "expireAt", "redirectTo", "created_at",
    ],
  },
  {
    name: "caseItems",
    columns: ["id", "caseId", "itemId", "rate", "expireAfter", "created_at"],
  },
  {
    name: "eventLevels",
    columns: [
      "id", "eventID", "levelID", "point", "totalProgress",
      "minEventProgress", "needRaw", "requiredLevel", "unlockCondition",
    ],
    orderCol: "id",
  },
  {
    name: "eventQuests",
    columns: ["id", "eventId", "title", "condition", "created_at"],
  },
  {
    name: "eventQuestRewards",
    columns: ["id", "questId", "rewardId", "expireAfter", "created_at"],
  },
  {
    name: "battlePassLevels",
    columns: [
      "id", "seasonId", "levelID", "type", "xp",
      "minProgress", "minProgressXp", "created_at",
    ],
  },
  {
    name: "battlePassMissions",
    columns: [
      "id", "seasonId", "title", "description", "condition",
      "refreshType", "xp", "order", "created_at",
    ],
  },
  {
    name: "battlePassTierRewards",
    columns: [
      "id", "seasonId", "tier", "itemId", "quantity",
      "isPremium", "description", "created_at",
    ],
  },
  {
    name: "battlePassMapPacks",
    columns: [
      "id", "seasonId", "mapPackId", "sortOrder", "unlockWeek", "created_at",
    ],
  },
  {
    name: "battlePassCourseEntries",
    columns: [
      "id", "courseId", "type", "refId", "rewardItemId",
      "rewardQuantity", "rewardXp", "sortOrder", "created_at",
    ],
  },
  {
    name: "battlePassMissionRewards",
    columns: ["id", "missionId", "itemId", "quantity", "expireAfter", "created_at"],
  },
  {
    name: "notifications",
    columns: ["id", "to", "content", "redirect", "status", "timestamp"],
    orderCol: "timestamp",
  },
  {
    name: "communityPosts",
    columns: [
      "id", "uid", "title", "content", "type", "imageUrl",
      "videoUrl", "attachedLevel", "attachedRecord", "clanId",
      "likesCount", "commentsCount", "viewsCount", "pinned",
      "isRecommended", "participantsCount", "maxParticipants",
      "createdAt", "updatedAt",
    ],
    orderCol: "createdAt",
  },
  {
    name: "communityComments",
    columns: [
      "id", "postId", "uid", "content", "attachedLevel",
      "likesCount", "hidden", "createdAt",
    ],
    orderCol: "createdAt",
  },
  {
    name: "heatmap",
    columns: ["uid", "year", "days"],
    orderCol: "year",
  },
  {
    name: "playerConvictions",
    columns: ["id", "userId", "content", "creditReduce", "isHidden", "created_at"],
  },

  // ── Tables with sensitive data ─────────────────────────────────────────
  {
    name: "APIKey",
    columns: ["uid", "key", "created_at"],
    anonymize: anonymizeApiKey,
  },
  {
    name: "otp",
    columns: ["code", "created_at", "expired_at", "granted_by", "is_expired"],
    anonymize: anonymizeOtp,
  },
  {
    name: "coupons",
    columns: [
      "code", "owner", "productID", "percent", "deduct",
      "quantity", "usageLeft", "validUntil", "created_at",
    ],
    anonymize: anonymizeCoupons,
  },
  {
    name: "userSocial",
    columns: ["id", "userid", "platform", "name", "isVisible", "created_at"],
    anonymize: anonymizeUserSocial,
  },
  {
    name: "orders",
    columns: [
      "id", "userID", "productID", "quantity", "amount", "currency",
      "paymentMethod", "state", "delivered", "discount", "fee",
      "address", "phone", "recipientName", "giftTo", "data",
      "coupon", "targetClanID", "created_at",
    ],
    anonymize: anonymizeOrders,
  },
  {
    name: "cards",
    columns: [
      "id", "name", "content", "img", "owner",
      "supporterIncluded", "activationDate", "created_at",
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🔄 Fetching production data...\n");

  const sqlParts: string[] = [
    "-- ==========================================================================",
    "-- Seed data generated from production database",
    `-- Generated at: ${new Date().toISOString()}`,
    "-- Sensitive fields have been replaced with fake data.",
    "-- ==========================================================================",
    "",
    "-- Temporarily disable triggers to avoid side-effects during seeding",
    "SET session_replication_role = 'replica';",
    "",
  ];

  for (const def of TABLE_DEFS) {
    const limit = def.limit ?? MIN_ROWS;
    const orderCol = def.orderCol ?? "created_at";
    const anonymize = def.anonymize ?? anonymizeDefault;

    process.stdout.write(`  📦 ${def.name} ... `);
    const rawRows = await fetchTable(def.name, limit, orderCol);

    if (rawRows.length === 0) {
      console.log("skip (0 rows)");
      continue;
    }

    const rows = rawRows.map((row, i) => anonymize(row as Record<string, unknown>, i));
    const sql = insertStatement(def.name, def.columns, rows);
    sqlParts.push(`-- ${def.name} (${rows.length} rows)`);
    sqlParts.push(sql);

    console.log(`${rows.length} rows`);
  }

  // Restore triggers
  sqlParts.push("");
  sqlParts.push("-- Re-enable triggers");
  sqlParts.push("SET session_replication_role = 'origin';");
  sqlParts.push("");

  const output = sqlParts.join("\n");
  writeFileSync(OUTPUT_PATH, output, "utf-8");

  console.log(`\n✅ Seed file written to: ${OUTPUT_PATH}`);
  console.log(`   Total UIDs anonymized: ${uidMap.size}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

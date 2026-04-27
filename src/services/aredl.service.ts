const AREDL_LEVELS_URL = "https://api.aredl.net/v2/api/aredl/levels";

type AredlRecord = Record<string, unknown>;

export type AredlLevel = {
  id: string;
  name: string;
  position: number;
  publisher_id: string | null;
  points: number;
  legacy: boolean;
  level_id: number;
  two_player: boolean;
  tags: string[];
  description: string | null;
  song: number | null;
  edel_enjoyment: number | null;
  is_edel_pending: boolean;
  gddl_tier: number | null;
  nlw_tier: number | null;
};

function isRecord(value: unknown): value is AredlRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length ? value.trim() : null;
}

function normalizeOptionalNumber(value: unknown) {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeAredlTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((tag) => normalizeOptionalString(tag))
    .filter((tag): tag is string => Boolean(tag));
}

function normalizeAredlLevel(value: unknown): AredlLevel | null {
  if (!isRecord(value)) {
    return null;
  }

  const position = Number(value.position);
  const levelId = Number(value.level_id);
  const points = Number(value.points);

  if (!Number.isInteger(position) || position <= 0) {
    return null;
  }

  if (!Number.isInteger(levelId) || levelId <= 0) {
    return null;
  }

  if (!Number.isInteger(points) || points < 0) {
    return null;
  }

  const id = normalizeOptionalString(value.id) ?? String(levelId);
  const name = normalizeOptionalString(value.name) ?? `AREDL level #${levelId}`;

  return {
    id,
    name,
    position,
    publisher_id: normalizeOptionalString(value.publisher_id),
    points,
    legacy: Boolean(value.legacy),
    level_id: levelId,
    two_player: Boolean(value.two_player),
    tags: normalizeAredlTags(value.tags),
    description: normalizeOptionalString(value.description),
    song: normalizeOptionalNumber(value.song),
    edel_enjoyment: normalizeOptionalNumber(value.edel_enjoyment),
    is_edel_pending: Boolean(value.is_edel_pending),
    gddl_tier: normalizeOptionalNumber(value.gddl_tier),
    nlw_tier: normalizeOptionalNumber(value.nlw_tier),
  };
}

export async function fetchAredlLevels(): Promise<AredlLevel[]> {
  const url = new URL(AREDL_LEVELS_URL);
  url.searchParams.set("exclude_legacy", "false");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Origin: "https://aredl.net",
      Referer: "https://aredl.net/",
      "User-Agent": "gdvn-aredl-mirror-crawler",
    },
  });

  if (!response.ok) {
    throw new Error(`AREDL responded with ${response.status}`);
  }

  const payload = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error("AREDL levels response must be an array");
  }

  if (!payload.length) {
    throw new Error("AREDL levels response must not be empty");
  }

  const levels = payload.map(normalizeAredlLevel);

  if (levels.some((level) => level === null)) {
    throw new Error("AREDL levels response contained an invalid level row");
  }

  return levels as AredlLevel[];
}

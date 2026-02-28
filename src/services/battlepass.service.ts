import supabase from "@src/client/supabase";
import type { TablesInsert } from "@src/types/supabase";
import { addInventoryItem } from "@src/services/inventory.service";
import { SubscriptionType } from "@src/const/subscription-type-const";
import { fetchPlayerDeathCount, getDeathCountProgress } from "@src/services/death-count.service";

const XP_PER_TIER = 100;
const MAX_TIER = 100;
const COMPLETION_THRESHOLD = 100;
const COURSE_CLEAR_XP = 100;

// ==================== Season Functions ====================

export async function getActiveseason() {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('battlePassSeasons')
        .select('*')
        .lte('start', now)
        .gte('end', now)
        .eq('isArchived', false)
        .order('start', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getSeason(seasonId: number) {
    const { data, error } = await supabase
        .from('battlePassSeasons')
        .select('*')
        .eq('id', seasonId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function isSeasonActive(seasonId: number): Promise<boolean> {
    const now = new Date().toISOString();
    const season = await getSeason(seasonId);

    return !season.isArchived &&
        new Date(season.start) <= new Date(now) &&
        new Date(season.end) >= new Date(now);
}

export async function createSeason(season: TablesInsert<"battlePassSeasons">) {
    const { data, error } = await supabase
        .from('battlePassSeasons')
        .insert(season)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateSeason(seasonId: number, updates: Partial<TablesInsert<"battlePassSeasons">>) {
    const { error } = await supabase
        .from('battlePassSeasons')
        .update(updates)
        .eq('id', seasonId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function archiveSeason(seasonId: number) {
    const { error } = await supabase
        .from('battlePassSeasons')
        .update({ isArchived: true })
        .eq('id', seasonId);

    if (error) {
        throw new Error(error.message);
    }
}

// ==================== Player Subscription Functions ====================

export async function hasPlayerSubscription(userId: string, subscriptionType: string, refId?: number) {
    const now = new Date().toISOString();

    let query = supabase
        .from('playerSubscriptions')
        .select('*, subscriptions!inner(*)')
        .eq('userID', userId)
        .eq('subscriptions.type', subscriptionType)
        .lte('start', now);

    if (refId !== undefined) {
        query = query.eq('subscriptions.refId', refId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    // Check if any subscription is still valid (end is null for permanent or end > now)
    return data.some(sub => sub.end === null || new Date(sub.end) > new Date());
}

export async function hasBattlePassPremium(userId: string, seasonId: number) {
    return hasPlayerSubscription(userId, SubscriptionType.BP_PREMIUM, seasonId);
}

export async function addPlayerSubscription(subscription: TablesInsert<"playerSubscriptions">) {
    const { data, error } = await supabase
        .from('playerSubscriptions')
        .insert(subscription)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getPlayerSubscriptions(userId: string) {
    const { data, error } = await supabase
        .from('playerSubscriptions')
        .select('*, subscriptions(*)')
        .eq('userID', userId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ==================== Progress Functions ====================

export async function getPlayerProgress(seasonId: number, userId: string) {
    const { data, error } = await supabase
        .from('battlePassProgress')
        .select('*')
        .eq('seasonId', seasonId)
        .eq('userID', userId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    // Check for premium subscription
    const isPremium = await hasBattlePassPremium(userId, seasonId);

    if (!data) {
        return {
            seasonId,
            userID: userId,
            xp: 0,
            isPremium,
            tier: 0
        };
    }

    return {
        ...data,
        isPremium,
        tier: calculateTier(data.xp)
    };
}

export async function addXp(
    seasonId: number,
    userId: string,
    xp: number,
    source: string = 'unknown',
    refId: number | null = null,
    description: string | null = null
) {
    const progress = await getPlayerProgress(seasonId, userId);
    const newXp = (progress?.xp || 0) + xp;

    const { error } = await supabase
        .from('battlePassProgress')
        .upsert({
            seasonId,
            userID: userId,
            xp: newXp
        });

    if (error) {
        throw new Error(error.message);
    }

    // Log the XP transaction
    await logXP(userId, seasonId, xp, source, refId, description);

    return {
        previousXp: progress?.xp || 0,
        newXp,
        previousTier: calculateTier(progress?.xp || 0),
        newTier: calculateTier(newXp)
    };
}

// ==================== XP Logging Functions ====================

export async function logXP(
    userId: string,
    seasonId: number,
    amount: number,
    source: string,
    refId: number | null = null,
    description: string | null = null
) {
    const { error } = await supabase
        .from('battlePassXPLogs')
        .insert({
            userID: userId,
            seasonId,
            amount,
            source,
            refId,
            description
        });

    if (error) {
        console.error('Failed to log XP:', error.message);
        // Don't throw - XP logging should not block the main operation
    }
}

export async function getPlayerXPLogs(seasonId: number, userId: string, limit: number = 50) {
    const { data, error } = await supabase
        .from('battlePassXPLogs')
        .select('*')
        .eq('userID', userId)
        .eq('seasonId', seasonId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function upgradeToPremium(seasonId: number, userId: string) {
    // Find or create a battlepass premium subscription for this season
    let { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('type', SubscriptionType.BP_PREMIUM)
        .eq('refId', seasonId)
        .maybeSingle();

    if (subError) {
        throw new Error(subError.message);
    }

    // If subscription for this season doesn't exist, create it
    if (!subscription) {
        const season = await getSeason(seasonId);
        const { data: newSubscription, error: createError } = await supabase
            .from('subscriptions')
            .insert({
                type: SubscriptionType.BP_PREMIUM,
                refId: seasonId,
                name: `Battle Pass Premium - ${season.title}`,
                price: 0
            })
            .select()
            .single();

        if (createError) {
            throw new Error(createError.message);
        }
        subscription = newSubscription;
    }

    // Add player subscription
    const { error } = await supabase
        .from('playerSubscriptions')
        .insert({
            userID: userId,
            subscriptionId: subscription.id,
            end: null // Permanent for the season
        });

    if (error) {
        throw new Error(error.message);
    }
}

export function calculateTier(xp: number): number {
    return Math.min(Math.floor(xp / XP_PER_TIER), MAX_TIER);
}

// ==================== Level Functions ====================

export async function getSeasonLevels(seasonId: number) {
    const { data, error } = await supabase
        .from('battlePassLevels')
        .select('*, levels(*)')
        .eq('seasonId', seasonId)
        .eq('type', 'normal')
        .order('id', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function addSeasonLevel(level: TablesInsert<"battlePassLevels">) {
    const { data, error } = await supabase
        .from('battlePassLevels')
        .insert(level)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateSeasonLevel(levelId: number, updates: Partial<TablesInsert<"battlePassLevels">>) {
    const { error } = await supabase
        .from('battlePassLevels')
        .update(updates)
        .eq('id', levelId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function deleteSeasonLevel(levelId: number) {
    const { error } = await supabase
        .from('battlePassLevels')
        .delete()
        .eq('id', levelId);

    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Check if a level (by its actual levelID) is in the active battlepass season.
 * Returns the battlePassLevel record if found, null otherwise.
 */
export async function getActiveBattlePassLevelByLevelID(levelID: number) {
    const season = await getActiveseason();
    if (!season) {
        return null;
    }

    const { data, error } = await supabase
        .from('battlePassLevels')
        .select('*')
        .eq('seasonId', season.id)
        .eq('levelID', levelID)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    if (data.type != 'normal') {
        const season = await getActiveseason()
        const lv = await getDailyWeeklyLevels(season.id);

        if (lv.daily?.id != data.id && lv.weekly?.id != data.id) {
            throw new Error('Daily or Weekly level expired')
        }
    }

    return data;
}

export async function getPlayerLevelProgress(battlePassLevelId: number, userId: string) {
    const { data, error } = await supabase
        .from('battlePassLevelProgress')
        .select('*')
        .eq('battlePassLevelId', battlePassLevelId)
        .eq('userID', userId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ==================== Daily/Weekly Level Functions ====================

export type LevelType = 'normal' | 'daily' | 'weekly';

async function getLatestDailyWeeklyLevel(seasonId: number, type: 'daily' | 'weekly') {
    const { data, error } = await supabase
        .from('battlePassLevels')
        .select('*, levels(*)')
        .eq('seasonId', seasonId)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get daily or weekly level for a season
 */
export async function getSeasonLevelByType(seasonId: number, type: LevelType) {
    // For daily/weekly we only want the latest level (limit 1)
    if (type === 'daily' || type === 'weekly') {
        const latestLevel = await getLatestDailyWeeklyLevel(seasonId, type);
        return latestLevel ? [latestLevel] : [];
    }

    // For normal type return all levels for the season
    const { data, error } = await supabase
        .from('battlePassLevels')
        .select('*, levels(*)')
        .eq('seasonId', seasonId)
        .eq('type', type)
        .order('id', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get both daily and weekly levels for a season with optional user progress
 */
export async function getDailyWeeklyLevels(seasonId: number, userId?: string) {
    const [dailyLevel, weeklyLevel] = await Promise.all([
        getLatestDailyWeeklyLevel(seasonId, 'daily'),
        getLatestDailyWeeklyLevel(seasonId, 'weekly')
    ]);

    // If userId provided, fetch progress for these levels
    let dailyProgress = null;
    let weeklyProgress = null;

    if (userId) {
        if (dailyLevel) {
            dailyProgress = await getPlayerLevelProgress(dailyLevel.id, userId);
        }
        if (weeklyLevel) {
            weeklyProgress = await getPlayerLevelProgress(weeklyLevel.id, userId);
        }
    }

    return {
        daily: dailyLevel ? {
            ...dailyLevel,
            progress: dailyProgress?.progress ?? 0,
            minProgressClaimed: dailyProgress?.minProgressClaimed ?? false,
            completionClaimed: dailyProgress?.completionClaimed ?? false
        } : null,
        weekly: weeklyLevel ? {
            ...weeklyLevel,
            progress: weeklyProgress?.progress ?? 0,
            minProgressClaimed: weeklyProgress?.minProgressClaimed ?? false,
            completionClaimed: weeklyProgress?.completionClaimed ?? false
        } : null
    };
}

/**
 * Claim XP reward for a daily/weekly level
 * @param claimType 'minProgress' for reaching minimum progress, 'completion' for 100% completion
 */
export async function claimDailyWeeklyReward(
    battlePassLevelId: number,
    userId: string,
    claimType: 'minProgress' | 'completion'
) {
    // Get the battle pass level
    const { data: bpLevel, error: bpLevelError } = await supabase
        .from('battlePassLevels')
        .select('*, levels(*)')
        .eq('id', battlePassLevelId)
        .single();

    if (bpLevelError || !bpLevel) {
        throw new Error('Level not found');
    }

    // Verify it's a daily or weekly level
    if (bpLevel.type !== 'daily' && bpLevel.type !== 'weekly') {
        throw new Error('This is not a daily or weekly level');
    }

    // Ensure only latest daily/weekly level is claimable
    const latestLevel = await getLatestDailyWeeklyLevel(bpLevel.seasonId, bpLevel.type);
    if (!latestLevel || latestLevel.id !== bpLevel.id) {
        throw new Error('Daily or Weekly level expired');
    }

    // Check if season is active
    const isActive = await isSeasonActive(bpLevel.seasonId);
    if (!isActive) {
        throw new Error('Season is not active');
    }

    // Get player progress
    const progress = await getPlayerLevelProgress(battlePassLevelId, userId);

    if (!progress) {
        throw new Error('No progress found');
    }

    // Validate claim based on type
    if (claimType === 'minProgress') {
        if (progress.minProgressClaimed) {
            throw new Error('Minimum progress reward already claimed');
        }
        if (progress.progress < bpLevel.minProgress) {
            throw new Error(`Need ${bpLevel.minProgress}% progress to claim this reward`);
        }
    } else if (claimType === 'completion') {
        if (progress.completionClaimed) {
            throw new Error('Completion reward already claimed');
        }
        if (progress.progress < COMPLETION_THRESHOLD) {
            throw new Error('Level not completed');
        }
    }

    // Calculate XP to award
    const xpToAward = claimType === 'minProgress' ? bpLevel.minProgressXp : bpLevel.xp;

    // Update claim status atomically to prevent double claim in concurrent requests
    const updateField = claimType === 'minProgress' ? 'minProgressClaimed' : 'completionClaimed';
    const { data: updatedClaim, error: updateError } = await supabase
        .from('battlePassLevelProgress')
        .update({ [updateField]: true })
        .eq('battlePassLevelId', battlePassLevelId)
        .eq('userID', userId)
        .eq(updateField, false)
        .select('battlePassLevelId')
        .maybeSingle();

    if (updateError) {
        throw new Error(updateError.message);
    }

    if (!updatedClaim) {
        throw new Error(claimType === 'minProgress'
            ? 'Minimum progress reward already claimed'
            : 'Completion reward already claimed');
    }

    // Award XP
    const xpResult = await addXp(
        bpLevel.seasonId,
        userId,
        xpToAward,
        `${bpLevel.type}_level`,
        battlePassLevelId,
        `${bpLevel.type === 'daily' ? 'Daily' : 'Weekly'} level ${claimType === 'minProgress' ? 'min progress' : 'completion'} reward`
    );

    return {
        xp: xpToAward,
        ...xpResult
    };
}

/**
 * Refresh daily level progress for all users in the active season
 * Removes all progress for daily levels, resets claims
 */
export async function refreshDailyLevelProgress() {
    const season = await getActiveseason();
    if (!season) {
        return { refreshed: 0, message: 'No active season' };
    }

    const latestDailyLevel = await getLatestDailyWeeklyLevel(season.id, 'daily');
    if (!latestDailyLevel) {
        return { refreshed: 0, message: 'No daily levels found' };
    }

    // Delete all progress for latest daily level only
    const { error: deleteError, count } = await supabase
        .from('battlePassLevelProgress')
        .delete()
        .eq('battlePassLevelId', latestDailyLevel.id);

    if (deleteError) {
        throw new Error(deleteError.message);
    }

    return {
        refreshed: count ?? 0,
        levelIds: [latestDailyLevel.id],
        seasonId: season.id
    };
}

/**
 * Refresh weekly level progress for all users in the active season
 * Removes all progress for weekly levels, resets claims
 */
export async function refreshWeeklyLevelProgress() {
    const season = await getActiveseason();
    if (!season) {
        return { refreshed: 0, message: 'No active season' };
    }

    const latestWeeklyLevel = await getLatestDailyWeeklyLevel(season.id, 'weekly');
    if (!latestWeeklyLevel) {
        return { refreshed: 0, message: 'No weekly levels found' };
    }

    // Delete all progress for latest weekly level only
    const { error: deleteError, count } = await supabase
        .from('battlePassLevelProgress')
        .delete()
        .eq('battlePassLevelId', latestWeeklyLevel.id);

    if (deleteError) {
        throw new Error(deleteError.message);
    }

    return {
        refreshed: count ?? 0,
        levelIds: [latestWeeklyLevel.id],
        seasonId: season.id
    };
}

export async function updatePlayerLevelProgress(
    battlePassLevelId: number,
    userId: string,
    progress: number
) {
    const existing = await getPlayerLevelProgress(battlePassLevelId, userId);

    const { error } = await supabase
        .from('battlePassLevelProgress')
        .upsert({
            battlePassLevelId,
            userID: userId,
            progress,
            minProgressClaimed: existing?.minProgressClaimed || false,
            completionClaimed: existing?.completionClaimed || false
        });

    if (error) {
        throw new Error(error.message);
    }
}

// Update level progress, also update map pack progress if the level is in a map pack, and check missions
export async function updateLevelProgressWithMissionCheck(
    battlePassLevelId: number,
    userId: string,
    progress: number
) {
    // Get the battle pass level details
    const { data: bpLevel, error: bpLevelError } = await supabase
        .from('battlePassLevels')
        .select('*, levels(*)')
        .eq('id', battlePassLevelId)
        .single();

    if (bpLevelError || !bpLevel) {
        throw new Error('Battle pass level not found');
    }

    // Update level progress
    await updatePlayerLevelProgress(battlePassLevelId, userId, progress);

    // If progress is at completion threshold, also update map pack progress for any map packs that contain this level
    if (progress >= COMPLETION_THRESHOLD) {
        // Find all mapPackLevels that contain this levelID
        const { data: mapPackLevels } = await supabase
            .from('mapPackLevels')
            .select('mapPackId, levelID')
            .eq('levelID', bpLevel.levelID);

        if (mapPackLevels && mapPackLevels.length > 0) {
            // Extract all mapPackIds for batch query
            const mapPackIds = mapPackLevels.map(mpl => mpl.mapPackId);

            // Find all battlePassMapPacks for this season in one query
            const { data: bpMapPacks } = await supabase
                .from('battlePassMapPacks')
                .select('id, mapPackId')
                .eq('seasonId', bpLevel.seasonId)
                .in('mapPackId', mapPackIds);

            if (bpMapPacks && bpMapPacks.length > 0) {
                const bpMapPackIds = bpMapPacks.map(bpmp => bpmp.id);

                // 1. Update Map Pack LEVEL Progress to 100
                await batchUpdateMapPackLevelProgress(bpMapPackIds, bpLevel.levelID, userId, 100);

                // 2. Recalculate Map Pack Progress
                for (const bpMapPackId of bpMapPackIds) {
                    try {
                        await updatePlayerMapPackProgress(bpMapPackId, userId);
                    } catch (e: any) {
                        console.error(`Failed to update map pack progress via level update: ${e.message}`);
                    }
                }
            }
        }
    }

    return { battlePassLevelId, progress };
}

// ==================== Map Pack Functions ====================

// Get map pack by id (from mapPacks table)
export async function getMapPackById(mapPackId: number) {
    const { data, error } = await supabase
        .from('mapPacks')
        .select('*, mapPackLevels(*, levels(*))')
        .eq('id', mapPackId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// Get all map packs
export async function getAllMapPacks() {
    const { data, error } = await supabase
        .from('mapPacks')
        .select('*, mapPackLevels(*, levels(*))');

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// Create a map pack (in mapPacks table)
export async function createMapPackGeneral(mapPack: TablesInsert<"mapPacks">) {
    const { data, error } = await supabase
        .from('mapPacks')
        .insert(mapPack)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// Update a map pack (in mapPacks table)
export async function updateMapPackGeneral(mapPackId: number, updates: Partial<TablesInsert<"mapPacks">>) {
    const { error } = await supabase
        .from('mapPacks')
        .update(updates)
        .eq('id', mapPackId);

    if (error) {
        throw new Error(error.message);
    }
}

// Delete a map pack (from mapPacks table)
export async function deleteMapPackGeneral(mapPackId: number) {
    const { error } = await supabase
        .from('mapPacks')
        .delete()
        .eq('id', mapPackId);

    if (error) {
        throw new Error(error.message);
    }
}

// Add level to a map pack (in mapPackLevels table)
export async function addMapPackLevelGeneral(level: TablesInsert<"mapPackLevels">) {
    const { data, error } = await supabase
        .from('mapPackLevels')
        .insert(level)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// Delete level from a map pack (from mapPackLevels table)
export async function deleteMapPackLevelGeneral(levelId: number) {
    const { error } = await supabase
        .from('mapPackLevels')
        .delete()
        .eq('id', levelId);

    if (error) {
        throw new Error(error.message);
    }
}

// ==================== Battle Pass Map Pack Functions ====================

export async function getSeasonMapPacks(seasonId: number) {
    const now = new Date();
    const season = await getSeason(seasonId);
    const seasonStart = new Date(season.start);
    const weeksSinceStart = Math.max(0, Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    const { data, error } = await supabase
        .from('battlePassMapPacks')
        .select('*, mapPacks(*, mapPackLevels(*, levels(*)))')
        .eq('seasonId', seasonId)
        .lte('unlockWeek', weeksSinceStart)
        .order('unlockWeek', { ascending: false })
        .order('sortOrder', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getNextLockedSeasonMapPack(seasonId: number) {
    const now = new Date();
    const season = await getSeason(seasonId);
    const seasonStart = new Date(season.start);
    const weeksSinceStart = Math.max(0, Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    const { data, error } = await supabase
        .from('battlePassMapPacks')
        .select('*, mapPacks(*, mapPackLevels(*, levels(*)))')
        .eq('seasonId', seasonId)
        .gt('unlockWeek', weeksSinceStart)
        .order('unlockWeek', { ascending: true })
        .order('sortOrder', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    if (!data) {
        return null;
    }

    const unlockAt = new Date(seasonStart.getTime() + data.unlockWeek * 7 * 24 * 60 * 60 * 1000).toISOString();

    return {
        ...data,
        unlockAt
    };
}

export async function getAllSeasonMapPacks(seasonId: number) {
    const { data, error } = await supabase
        .from('battlePassMapPacks')
        .select('*, mapPacks(*, mapPackLevels(*, levels(*)))')
        .eq('seasonId', seasonId)
        .order('unlockWeek', { ascending: true })
        .order('sortOrder', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getBattlePassMapPack(battlePassMapPackId: number) {
    const { data, error } = await supabase
        .from('battlePassMapPacks')
        .select('*, mapPacks(*, mapPackLevels(*, levels(*)))')
        .eq('id', battlePassMapPackId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function addBattlePassMapPack(bpMapPack: TablesInsert<"battlePassMapPacks">) {
    // Push all map packs with sortOrder >= new sortOrder by 1
    if (bpMapPack.sortOrder !== undefined && bpMapPack.seasonId !== undefined) {
        // Get all map packs that need to be shifted
        const { data: mapPacksToShift, error: fetchError } = await supabase
            .from('battlePassMapPacks')
            .select('id, sortOrder')
            .eq('seasonId', bpMapPack.seasonId)
            .gte('sortOrder', bpMapPack.sortOrder);

        if (fetchError) {
            throw new Error(fetchError.message);
        }

        // Update each map pack by incrementing its sortOrder
        for (const mapPack of mapPacksToShift || []) {
            const { error: updateError } = await supabase
                .from('battlePassMapPacks')
                .update({ sortOrder: mapPack.sortOrder + 1 })
                .eq('id', mapPack.id);

            if (updateError) {
                throw new Error(updateError.message);
            }
        }
    }

    const { data, error } = await supabase
        .from('battlePassMapPacks')
        .insert(bpMapPack)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateBattlePassMapPack(battlePassMapPackId: number, updates: Partial<TablesInsert<"battlePassMapPacks">>) {
    if (updates.sortOrder !== undefined) {
        const { data: currentMapPack, error: fetchError } = await supabase
            .from('battlePassMapPacks')
            .select('seasonId, sortOrder')
            .eq('id', battlePassMapPackId)
            .single();

        if (fetchError) {
            throw new Error(fetchError.message);
        }
    }

    const { error } = await supabase
        .from('battlePassMapPacks')
        .update(updates)
        .eq('id', battlePassMapPackId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function deleteBattlePassMapPack(battlePassMapPackId: number) {
    const { error } = await supabase
        .from('battlePassMapPacks')
        .delete()
        .eq('id', battlePassMapPackId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function getPlayerMapPackProgress(battlePassMapPackId: number, userId: string) {
    const { data, error } = await supabase
        .from('battlePassMapPackProgress')
        .select('*')
        .eq('battlePassMapPackId', battlePassMapPackId)
        .eq('userID', userId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function completeMapPackLevel(battlePassMapPackId: number, userId: string, levelId: number) {
    // Update level progress to 100%
    const { error } = await supabase
        .from('battlePassMapPackLevelProgress')
        .upsert({
            battlePassMapPackId,
            levelID: levelId,
            userID: userId,
            progress: 100
        });

    if (error) {
        throw new Error(error.message);
    }

    return await updatePlayerMapPackProgress(battlePassMapPackId, userId);
}

export async function updatePlayerMapPackProgress(battlePassMapPackId: number, userId: string) {
    const bpMapPack = await getBattlePassMapPack(battlePassMapPackId);

    // Get count of levels
    const totalLevels = bpMapPack.mapPacks?.mapPackLevels?.length || 0;

    // Get total progress from all levels
    const { data: levelsProgress, error: levelsError } = await supabase
        .from('battlePassMapPackLevelProgress')
        .select('progress')
        .eq('battlePassMapPackId', battlePassMapPackId)
        .eq('userID', userId);

    if (levelsError) {
        throw new Error(levelsError.message);
    }

    const totalProgressSum = levelsProgress?.reduce((sum, item) => sum + (item.progress || 0), 0) || 0;

    // Formula: (total progress in battlePassMapPackLevelProgress) / (100 * count of mapPackLevels level)
    const overallProgress = totalLevels > 0 ? totalProgressSum / (100 * totalLevels) : 0;

    const progress = await getPlayerMapPackProgress(battlePassMapPackId, userId);

    const isFullyCompleted = overallProgress >= 1;
    const shouldClaim = isFullyCompleted && !progress?.claimed;

    // Update progress
    const { error } = await supabase
        .from('battlePassMapPackProgress')
        .upsert({
            battlePassMapPackId,
            userID: userId,
            progress: overallProgress * 100,
            claimed: shouldClaim ? true : (progress?.claimed || false)
        });

    if (error) {
        throw new Error(error.message);
    }

    // If fully completed and not previously claimed, grant XP
    if (shouldClaim) {
        const mapPackXp = bpMapPack.mapPacks?.xp || 0;
        if (mapPackXp > 0) {
            await addXp(
                bpMapPack.seasonId,
                userId,
                mapPackXp,
                'mappack_auto',
                battlePassMapPackId,
                `Auto-completed map pack: ${bpMapPack.mapPacks?.name || 'Unknown'}`
            );
        }
    }

    return {
        progress: overallProgress,
        claimed: shouldClaim ? true : (progress?.claimed || false),
        xpGranted: shouldClaim ? (bpMapPack.mapPacks?.xp || 0) : 0
    };
}

export async function claimMapPackReward(battlePassMapPackId: number, userId: string) {
    const bpMapPack = await getBattlePassMapPack(battlePassMapPackId);

    // Check if season is active
    const seasonActive = await isSeasonActive(bpMapPack.seasonId);
    if (!seasonActive) {
        throw new Error('Season is not active');
    }

    const progress = await getPlayerMapPackProgress(battlePassMapPackId, userId);

    if (!progress) {
        throw new Error('No progress found');
    }

    if (progress.claimed) {
        throw new Error('Already claimed');
    }

    if ((progress.progress || 0) < 100) {
        throw new Error('Map pack not completed');
    }

    const { error } = await supabase
        .from('battlePassMapPackProgress')
        .update({ claimed: true })
        .eq('battlePassMapPackId', battlePassMapPackId)
        .eq('userID', userId);

    if (error) {
        throw new Error(error.message);
    }

    // Get the XP from the mapPacks table
    const mapPackXp = bpMapPack.mapPacks?.xp || 0;

    // Add XP to player with logging
    await addXp(
        bpMapPack.seasonId,
        userId,
        mapPackXp,
        'mappack',
        battlePassMapPackId,
        `Claimed map pack: ${bpMapPack.mapPacks?.name || 'Unknown'}`
    );

    return mapPackXp;
}

// ==================== Course Mode Functions ====================

type CourseEntryType = 'level' | 'mappack';

export async function getAllCourses() {
    const { data, error } = await (supabase as any)
        .from('battlePassCourses')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}

export async function getCourse(courseId: number) {
    const { data, error } = await (supabase as any)
        .from('battlePassCourses')
        .select('*')
        .eq('id', courseId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function createCourse(course: { title: string; description?: string | null }) {
    const { data, error } = await (supabase as any)
        .from('battlePassCourses')
        .insert(course)
        .select('*')
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateCourse(courseId: number, updates: { title?: string; description?: string | null }) {
    const { error } = await (supabase as any)
        .from('battlePassCourses')
        .update(updates)
        .eq('id', courseId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function deleteCourse(courseId: number) {
    const { error } = await (supabase as any)
        .from('battlePassCourses')
        .delete()
        .eq('id', courseId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function getCourseEntries(courseId: number) {
    const { data, error } = await (supabase as any)
        .from('battlePassCourseEntries')
        .select('*')
        .eq('courseId', courseId)
        .order('sortOrder', { ascending: true })
        .order('id', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}

export async function createCourseEntry(entry: {
    courseId: number;
    type: CourseEntryType;
    refId: number;
    sortOrder?: number;
    rewardXp?: number;
    rewardItemId?: number | null;
    rewardQuantity?: number;
}) {
    const { data, error } = await (supabase as any)
        .from('battlePassCourseEntries')
        .insert({
            ...entry,
            rewardXp: COURSE_CLEAR_XP
        })
        .select('*')
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateCourseEntry(entryId: number, updates: {
    type?: CourseEntryType;
    refId?: number;
    sortOrder?: number;
    rewardXp?: number;
    rewardItemId?: number | null;
    rewardQuantity?: number;
}) {
    const { error } = await (supabase as any)
        .from('battlePassCourseEntries')
        .update({
            ...updates,
            rewardXp: COURSE_CLEAR_XP
        })
        .eq('id', entryId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function deleteCourseEntry(entryId: number) {
    const { error } = await (supabase as any)
        .from('battlePassCourseEntries')
        .delete()
        .eq('id', entryId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function updateCourseProgress(
    seasonId: number,
    userId: string,
    levelId: number,
    progress: number

) {
    const season = await getSeason(seasonId) as any;
    const courseId = season?.courseId ? Number(season.courseId) : null;

    if (!courseId) {
        return { updated: 0, rewarded: 0 };
    }

    const entries = await getCourseEntries(courseId);
    if (!entries.length) {
        return { updated: 0, rewarded: 0 };
    }

    const normalizedProgress = Math.max(0, Math.min(100, Number(progress) || 0));

    const { data: bpLevelRows, error: bpLevelRowsError } = await (supabase as any)
        .from('battlePassLevels')
        .select('id')
        .eq('seasonId', seasonId)
        .eq('levelID', levelId);

    if (bpLevelRowsError) {
        throw new Error(bpLevelRowsError.message);
    }

    const matchedLevelEntryIds = new Set<number>();
    const bpLevelIds = new Set<number>((bpLevelRows || []).map((row: any) => Number(row.id)));

    for (const entry of entries as any[]) {
        if (entry.type === 'level' && bpLevelIds.has(Number(entry.refId))) {
            matchedLevelEntryIds.add(Number(entry.id));
        }
    }

    const { data: mapPackRows, error: mapPackRowsError } = await (supabase as any)
        .from('battlePassMapPacks')
        .select('id, mapPackId, mapPacks!inner(mapPackLevels!inner(levelID))')
        .eq('seasonId', seasonId)
        .eq('mapPacks.mapPackLevels.levelID', levelId);

    if (mapPackRowsError) {
        throw new Error(mapPackRowsError.message);
    }

    const mapPackIdToBpMapPackId = new Map<number, number>();
    (mapPackRows || []).forEach((row: any) => {
        mapPackIdToBpMapPackId.set(Number(row.id), Number(row.id));
    });

    const matchedMapPackEntries = (entries as any[])
        .filter((entry: any) => entry.type === 'mappack' && mapPackIdToBpMapPackId.has(Number(entry.refId)));

    const matchedEntryIds = [
        ...Array.from(matchedLevelEntryIds),
        ...matchedMapPackEntries.map((entry: any) => Number(entry.id))
    ];

    if (matchedEntryIds.length === 0) {
        return { updated: 0, rewarded: 0 };
    }

    const { data: existingProgressRows, error: existingProgressError } = await (supabase as any)
        .from('battlePassCourseEntryProgress')
        .select('*')
        .eq('userID', userId)
        .in('entryId', matchedEntryIds);

    if (existingProgressError) {
        throw new Error(existingProgressError.message);
    }

    const existingProgressMap = new Map<number, any>((existingProgressRows || []).map((row: any) => [Number(row.entryId), row]));

    const mapPackEntryByBpMapPackId = new Map<number, any>();
    for (const entry of matchedMapPackEntries) {
        mapPackEntryByBpMapPackId.set(Number(entry.refId), entry);
    }

    let mapPackProgressMap = new Map<number, number>();
    const matchedBpMapPackIds = Array.from(mapPackEntryByBpMapPackId.keys());
    if (matchedBpMapPackIds.length > 0) {
        const { data: mapPackProgressRows, error: mapPackProgressError } = await (supabase as any)
            .from('battlePassMapPackProgress')
            .select('battlePassMapPackId, progress')
            .eq('userID', userId)
            .in('battlePassMapPackId', matchedBpMapPackIds);

        if (mapPackProgressError) {
            throw new Error(mapPackProgressError.message);
        }

        mapPackProgressMap = new Map<number, number>();
        (mapPackProgressRows || []).forEach((row: any) => {
            mapPackProgressMap.set(Number(row.battlePassMapPackId), Number(row.progress) || 0);
        });
    }

    let updated = 0;
    let rewarded = 0;

    for (const entry of entries as any[]) {
        const entryId = Number(entry.id);
        if (!matchedEntryIds.includes(entryId)) {
            continue;
        }

        const nextProgress = entry.type === 'mappack'
            ? Math.max(0, Math.min(100, mapPackProgressMap.get(Number(entry.refId)) || 0))
            : normalizedProgress;

        const current = existingProgressMap.get(entryId);
        const currentProgress = Number(current?.progress || 0);

        if (current && nextProgress <= currentProgress) {
            continue;
        }

        const now = new Date().toISOString();
        const completed = nextProgress >= 100;
        const claimed = completed ? true : !!current?.claimed;

        const { error: upsertError } = await (supabase as any)
            .from('battlePassCourseEntryProgress')
            .upsert({
                entryId,
                userID: userId,
                progress: nextProgress,
                completed,
                completedAt: completed ? (current?.completedAt || now) : null,
                claimed,
                claimedAt: completed ? (current?.claimedAt || now) : null
            });

        if (upsertError) {
            throw new Error(upsertError.message);
        }

        updated++;

        const shouldReward = completed && !current?.claimed;
        if (!shouldReward) {
            continue;
        }

        const rewardXp = Number(entry.rewardXp || COURSE_CLEAR_XP);
        if (rewardXp > 0) {
            await addXp(
                seasonId,
                userId,
                rewardXp,
                'course_auto',
                entryId,
                `Auto-completed course entry reward: ${entry.type}#${entry.refId}`
            );
        }

        const rewardItemId = entry.rewardItemId ? Number(entry.rewardItemId) : null;
        const rewardQuantity = Number(entry.rewardQuantity || 1);
        if (rewardItemId && rewardQuantity > 0) {
            for (let i = 0; i < rewardQuantity; i++) {
                await addInventoryItem({
                    userID: userId,
                    itemId: rewardItemId,
                    expireAt: null
                });
            }
        }

        rewarded++;
    }

    return { updated, rewarded };
}

export async function getActiveSeasonCourse(userId?: string) {
    const season = await getActiveseason() as any;
    if (!season || !season.courseId) {
        return null;
    }

    const course = await getCourse(Number(season.courseId));
    const entries = await getCourseEntries(Number(season.courseId));

    const levelEntryRefs = [...new Set(entries
        .filter((entry: any) => entry.type === 'level')
        .map((entry: any) => Number(entry.refId)))];

    const mapPackEntryRefs = [...new Set(entries
        .filter((entry: any) => entry.type === 'mappack')
        .map((entry: any) => Number(entry.refId)))];

    const rewardItemIds = [...new Set(entries
        .map((entry: any) => entry.rewardItemId ? Number(entry.rewardItemId) : null)
        .filter((itemId: number | null) => itemId !== null))] as number[];

    const levelDataMap = new Map<number, any>();
    const mapPackDataMap = new Map<number, any>();
    const rewardItemDataMap = new Map<number, any>();

    if (levelEntryRefs.length > 0) {
        const { data: levelRows, error: levelRowsError } = await (supabase as any)
            .from('battlePassLevels')
            .select('id, levelID, levels(*)')
            .in('id', levelEntryRefs);

        if (levelRowsError) {
            throw new Error(levelRowsError.message);
        }

        (levelRows || []).forEach((row: any) => {
            if (row?.id != null) {
                levelDataMap.set(Number(row.id), row.levels || null);
            }
        });
    }

    if (mapPackEntryRefs.length > 0) {
        const { data: mapPackRows, error: mapPackRowsError } = await (supabase as any)
            .from('battlePassMapPacks')
            .select('id, mapPackId, mapPacks(*, mapPackLevels(*, levels(*)))')
            .in('id', mapPackEntryRefs);

        if (mapPackRowsError) {
            throw new Error(mapPackRowsError.message);
        }

        (mapPackRows || []).forEach((row: any) => {
            if (row?.id != null) {
                mapPackDataMap.set(Number(row.id), row.mapPacks || null);
            }
        });
    }

    if (rewardItemIds.length > 0) {
        const { data: rewardItemRows, error: rewardItemRowsError } = await (supabase as any)
            .from('items')
            .select('*')
            .in('id', rewardItemIds);

        if (rewardItemRowsError) {
            console.error('Failed to join course reward items:', rewardItemRowsError.message);
        } else {
            (rewardItemRows || []).forEach((row: any) => {
                if (row?.id != null) {
                    rewardItemDataMap.set(Number(row.id), row);
                }
            });
        }
    }

    let progressMap = new Map<number, any>();
    if (userId && entries.length > 0) {
        const { data: progressRows, error: progressError } = await (supabase as any)
            .from('battlePassCourseEntryProgress')
            .select('*')
            .eq('userID', userId)
            .in('entryId', entries.map((e: any) => e.id));

        if (progressError) {
            throw new Error(progressError.message);
        }

        progressMap = new Map<number, any>((progressRows || []).map((p: any) => [p.entryId, p]));
    }

    let allPreviousCompleted = true;
    const entriesWithProgress = entries.map((entry: any, index: number) => {
        const progress = progressMap.get(entry.id);
        const completed = !!progress?.completed;
        const claimed = !!progress?.claimed;

        const unlocked = index === 0 ? true : allPreviousCompleted;
        allPreviousCompleted = allPreviousCompleted && completed;

        return {
            ...entry,
            rewardXp: COURSE_CLEAR_XP,
            rewardItemData: entry.rewardItemId ? (rewardItemDataMap.get(Number(entry.rewardItemId)) || null) : null,
            levelData: entry.type === 'level' ? (levelDataMap.get(Number(entry.refId)) || null) : null,
            mapPackData: entry.type === 'mappack' ? (mapPackDataMap.get(Number(entry.refId)) || null) : null,
            unlocked,
            completed,
            claimed
        };
    });

    return {
        course,
        seasonId: season.id,
        entries: entriesWithProgress
    };
}

export async function claimCourseEntryReward(entryId: number, userId: string) {
    const { data: entry, error: entryError } = await (supabase as any)
        .from('battlePassCourseEntries')
        .select('*')
        .eq('id', entryId)
        .single();

    if (entryError || !entry) {
        throw new Error('Course entry not found');
    }

    const season = await getActiveseason() as any;
    if (!season || Number(season.courseId) !== Number(entry.courseId)) {
        throw new Error('Season is not active');
    }

    const entries = await getCourseEntries(Number(entry.courseId));
    const targetIndex = entries.findIndex((e: any) => e.id === entryId);
    if (targetIndex < 0) {
        throw new Error('Course entry not found');
    }

    const { data: progressRows, error: progressError } = await (supabase as any)
        .from('battlePassCourseEntryProgress')
        .select('*')
        .eq('userID', userId)
        .in('entryId', entries.map((e: any) => e.id));

    if (progressError) {
        throw new Error(progressError.message);
    }

    const progressMap = new Map<number, any>((progressRows || []).map((p: any) => [p.entryId, p]));
    const targetProgress = progressMap.get(entryId);

    if (!targetProgress?.completed) {
        throw new Error('Course entry not completed');
    }

    if (targetProgress?.claimed) {
        throw new Error('Already claimed');
    }

    for (let i = 0; i < targetIndex; i++) {
        const previousProgress = progressMap.get(entries[i].id);
        if (!previousProgress?.completed) {
            throw new Error('Course entry is locked');
        }
    }

    const now = new Date().toISOString();
    const { error: claimError } = await (supabase as any)
        .from('battlePassCourseEntryProgress')
        .upsert({
            entryId,
            userID: userId,
            completed: true,
            completedAt: targetProgress.completedAt || now,
            claimed: true,
            claimedAt: now
        });

    if (claimError) {
        throw new Error(claimError.message);
    }

    const rewardXp = Number(entry.rewardXp || 0);
    if (rewardXp > 0) {
        await addXp(
            season.id,
            userId,
            rewardXp,
            'course',
            entryId,
            `Claimed course entry reward: ${entry.type}#${entry.refId}`
        );
    }

    const rewardItemId = entry.rewardItemId ? Number(entry.rewardItemId) : null;
    const rewardQuantity = Number(entry.rewardQuantity || 1);
    if (rewardItemId && rewardQuantity > 0) {
        for (let i = 0; i < rewardQuantity; i++) {
            await addInventoryItem({
                userID: userId,
                itemId: rewardItemId,
                expireAt: null
            });
        }
    }

    return {
        rewardXp,
        rewardItemId,
        rewardQuantity
    };
}

// ==================== Tier Reward Functions ====================

export async function getTierRewards(seasonId: number) {
    const { data, error } = await supabase
        .from('battlePassTierRewards')
        .select('*, items(*)')
        .eq('seasonId', seasonId)
        .order('tier', { ascending: true })
        .order('isPremium', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function createTierReward(reward: TablesInsert<"battlePassTierRewards">) {
    const { data, error } = await supabase
        .from('battlePassTierRewards')
        .insert(reward)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function deleteTierReward(rewardId: number) {
    const { error } = await supabase
        .from('battlePassTierRewards')
        .delete()
        .eq('id', rewardId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function getPlayerClaimedRewards(seasonId: number, userId: string) {
    const { data, error } = await supabase
        .from('battlePassRewardClaims')
        .select('*, battlePassTierRewards!inner(*)')
        .eq('battlePassTierRewards.seasonId', seasonId)
        .eq('userID', userId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function claimTierReward(rewardId: number, userId: string) {
    // Get reward details
    const { data: reward, error: rewardError } = await supabase
        .from('battlePassTierRewards')
        .select('*, items(*)')
        .eq('id', rewardId)
        .single();

    if (rewardError || !reward) {
        throw new Error('Reward not found');
    }

    // Check if season is active
    const seasonActive = await isSeasonActive(reward.seasonId);
    if (!seasonActive) {
        throw new Error('Season is not active');
    }

    // Get player progress
    const progress = await getPlayerProgress(reward.seasonId, userId);

    // Check if player has reached the tier
    if (progress.tier < reward.tier) {
        throw new Error('Tier not reached');
    }

    // Check if premium reward but player is not premium
    if (reward.isPremium && !progress.isPremium) {
        throw new Error('Premium required');
    }

    // Check if already claimed
    const { data: existingClaim } = await supabase
        .from('battlePassRewardClaims')
        .select('*')
        .eq('rewardId', rewardId)
        .eq('userID', userId)
        .maybeSingle();

    if (existingClaim) {
        throw new Error('Already claimed');
    }

    // Claim the reward
    const { error: claimError } = await supabase
        .from('battlePassRewardClaims')
        .insert({
            rewardId,
            userID: userId
        });

    if (claimError) {
        throw new Error(claimError.message);
    }

    // Add item to inventory
    for (let i = 0; i < reward.quantity; i++) {
        await addInventoryItem({
            userID: userId,
            itemId: reward.itemId,
            expireAt: null
        });
    }

    return reward;
}

export async function getClaimableRewards(seasonId: number, userId: string) {
    const progress = await getPlayerProgress(seasonId, userId);
    const allRewards = await getTierRewards(seasonId);
    const claimedRewards = await getPlayerClaimedRewards(seasonId, userId);

    const claimedIds = new Set(claimedRewards.map(c => c.rewardId));

    return allRewards.filter(reward => {
        if (claimedIds.has(reward.id)) return false;
        if (reward.tier > progress.tier) return false;
        if (reward.isPremium && !progress.isPremium) return false;
        return true;
    });
}

// ==================== Mission Functions ====================

export async function getSeasonMissions(seasonId: number) {
    const { data, error } = await supabase
        .from('battlePassMissions')
        .select('*, rewards:battlePassMissionRewards(*, items(*))')
        .eq('seasonId', seasonId)
        .order('order', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getMission(missionId: number) {
    const { data, error } = await supabase
        .from('battlePassMissions')
        .select('*, rewards:battlePassMissionRewards(*, items(*))')
        .eq('id', missionId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function createMission(mission: TablesInsert<"battlePassMissions">) {
    const { data, error } = await supabase
        .from('battlePassMissions')
        .insert(mission)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateMission(missionId: number, updates: Partial<TablesInsert<"battlePassMissions">>) {
    const { error } = await supabase
        .from('battlePassMissions')
        .update(updates)
        .eq('id', missionId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function deleteMission(missionId: number) {
    // CASCADE DELETE is configured on foreign keys, so we only need to delete the mission
    const { error } = await supabase
        .from('battlePassMissions')
        .delete()
        .eq('id', missionId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function addMissionReward(missionId: number, itemId: number, quantity: number = 1, expireAfter: number | null = null) {
    if (expireAfter === null) {
        const { data } = await supabase
            .from('items')
            .select('defaultExpireAfter')
            .eq('id', itemId)
            .single();

        if (data) {
            expireAfter = data.defaultExpireAfter;
        }
    }

    const { data, error } = await supabase
        .from('battlePassMissionRewards')
        .insert({
            missionId,
            itemId,
            quantity,
            expireAfter
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function removeMissionReward(rewardId: number) {
    const { error } = await supabase
        .from('battlePassMissionRewards')
        .delete()
        .eq('id', rewardId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function isMissionClaimed(userId: string, missionId: number) {
    const { data, error } = await supabase
        .from('battlePassMissionClaims')
        .select('*')
        .eq('userID', userId)
        .eq('missionId', missionId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return !!data;
}

export async function getMissionProgress(userId: string, missionId: number) {
    const { data, error } = await supabase
        .from('battlePassMissionProgress')
        .select('*')
        .eq('userID', userId)
        .eq('missionId', missionId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function setMissionCompleted(userId: string, missionId: number) {
    const { error } = await supabase
        .from('battlePassMissionProgress')
        .upsert({
            missionId,
            userID: userId,
            completed: true
        });

    if (error) {
        throw new Error(error.message);
    }
}

interface MissionCondition {
    type: string;
    value: number;
    target?: string;
    targetId?: number;
}

export async function isMissionCompleted(userId: string, missionId: number) {
    const mission = await getMission(missionId);

    // Validate condition is an array
    if (!Array.isArray(mission.condition)) {
        console.error(`Mission ${missionId} has invalid condition format - expected array`);
        return false;
    }

    const conditions: MissionCondition[] = mission.condition as unknown as MissionCondition[];

    for (const condition of conditions) {
        switch (condition.type) {
            case 'clear_level': {
                // Check if user has cleared the specific level
                if (!condition.targetId) {
                    console.error(`Mission ${missionId}: clear_level condition missing targetId`);
                    return false;
                }
                const { data } = await supabase
                    .from('records')
                    .select('*')
                    .eq('userid', userId)
                    .eq('levelid', condition.targetId)
                    .eq('progress', 100)
                    .not('isChecked', 'is', null)
                    .maybeSingle();

                if (!data) return false;
                break;
            }
            case 'clear_mappack': {
                // Check if user has cleared all levels in a battle pass map pack
                if (!condition.targetId) {
                    console.error(`Mission ${missionId}: clear_mappack condition missing targetId`);
                    return false;
                }
                const progress = await getPlayerMapPackProgress(condition.targetId, userId);
                if (!progress) return false;

                if ((progress.progress || 0) < 100) return false;
                break;
            }
            case 'reach_tier': {
                // Check if user has reached a specific tier
                const seasonProgress = await getPlayerProgress(mission.seasonId, userId);
                if (seasonProgress.tier < condition.value) return false;
                break;
            }
            case 'earn_xp': {
                // Check if user has earned at least X amount of XP
                const seasonProgress = await getPlayerProgress(mission.seasonId, userId);
                if (seasonProgress.xp < condition.value) return false;
                break;
            }
            case 'clear_level_count': {
                // Check if user has cleared at least X number of levels in the season
                const seasonLevels = await getSeasonLevels(mission.seasonId);
                const bpMapPacks = await getAllSeasonMapPacks(mission.seasonId);

                let completedCount = 0;

                // Count completed battle pass levels
                for (const level of seasonLevels) {
                    const levelProgress = await getPlayerLevelProgress(level.id, userId);
                    if (levelProgress && levelProgress.progress >= 100) {
                        completedCount++;
                    }
                }

                if (completedCount < condition.value) return false;
                break;
            }
            case 'clear_mappack_count': {
                // Check if user has completed at least X map packs
                const bpMapPacks = await getAllSeasonMapPacks(mission.seasonId);
                let completedPackCount = 0;

                for (const pack of bpMapPacks) {
                    const packProgress = await getPlayerMapPackProgress(pack.id, userId);
                    if (packProgress) {
                        const totalLevels = pack.mapPacks?.mapPackLevels?.length || 0;
                        if (packProgress.progress == 100) {
                            completedPackCount++;
                        }
                    }
                }

                if (completedPackCount < condition.value) return false;
                break;
            }
        }
    }

    return true;
}

export async function claimMission(missionId: number, userId: string) {
    // Check if already claimed
    const alreadyClaimed = await isMissionClaimed(userId, missionId);
    if (alreadyClaimed) {
        throw new Error('Already claimed');
    }

    // Check if mission is completed using battlePassMissionProgress table
    const missionProgress = await getMissionProgress(userId, missionId);
    if (!missionProgress || !missionProgress.completed) {
        throw new Error('Mission not completed');
    }

    const mission = await getMission(missionId);

    // Check if season is active
    const seasonActive = await isSeasonActive(mission.seasonId);
    if (!seasonActive) {
        throw new Error('Season is not active');
    }

    // Insert claim record
    const { error: claimError } = await supabase
        .from('battlePassMissionClaims')
        .insert({
            missionId,
            userID: userId
        });

    if (claimError) {
        throw new Error(claimError.message);
    }

    // Add XP to player with logging
    await addXp(
        mission.seasonId,
        userId,
        mission.xp,
        'mission',
        missionId,
        `Claimed mission: ${mission.title}`
    );

    // Add reward items to inventory
    if (mission.rewards && Array.isArray(mission.rewards)) {
        for (const reward of mission.rewards) {
            const expireAt = reward.expireAfter
                ? new Date(Date.now() + reward.expireAfter).toISOString()
                : null;

            for (let i = 0; i < (reward.quantity || 1); i++) {
                await addInventoryItem({
                    userID: userId,
                    itemId: reward.itemId,
                    expireAt
                });
            }
        }
    }

    return mission;
}

export async function getPlayerMissionStatus(seasonId: number, userId: string) {
    const missions = await getSeasonMissions(seasonId);

    if (!missions || missions.length === 0) {
        return [];
    }

    const missionIds = missions.map(m => m.id);

    // Batch fetch claims
    const { data: claims, error: claimsError } = await supabase
        .from('battlePassMissionClaims')
        .select('missionId')
        .eq('userID', userId)
        .in('missionId', missionIds);

    if (claimsError) {
        throw new Error(claimsError.message);
    }

    const claimedSet = new Set(claims?.map(c => c.missionId));

    // Batch fetch progress
    const { data: progressList, error: progressError } = await supabase
        .from('battlePassMissionProgress')
        .select('missionId, completed')
        .eq('userID', userId)
        .in('missionId', missionIds);

    if (progressError) {
        throw new Error(progressError.message);
    }

    const progressMap = new Map<number, boolean>();
    if (progressList) {
        progressList.forEach(p => progressMap.set(p.missionId, p.completed));
    }

    return missions.map(mission => {
        const claimed = claimedSet.has(mission.id);
        const progressCompleted = progressMap.get(mission.id) || false;

        // If claimed, it is considered completed
        const isCompleted = claimed || progressCompleted;

        return {
            ...mission,
            claimed,
            completed: isCompleted,
            claimable: !claimed && isCompleted
        };
    });
}

export async function getBatchLevelProgress(battlePassLevelIds: number[], userId: string) {
    if (battlePassLevelIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('battlePassLevelProgress')
        .select('*')
        .eq('userID', userId)
        .in('battlePassLevelId', battlePassLevelIds);

    if (error) {
        throw new Error(error.message);
    }

    const progressMap = new Map<number, any>();
    data?.forEach(p => progressMap.set(p.battlePassLevelId, p));

    return battlePassLevelIds.map(id => {
        const existing = progressMap.get(id);
        if (existing) {
            return existing;
        }
        return {
            battlePassLevelId: id,
            userID: userId,
            progress: 0,
            minProgressClaimed: false,
            completionClaimed: false
        };
    });
}

export async function getBatchMapPackProgress(battlePassMapPackIds: number[], userId: string) {
    if (battlePassMapPackIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('battlePassMapPackProgress')
        .select('*')
        .eq('userID', userId)
        .in('battlePassMapPackId', battlePassMapPackIds);

    if (error) {
        throw new Error(error.message);
    }

    const progressMap = new Map<number, any>();
    data?.forEach(p => progressMap.set(p.battlePassMapPackId, p));

    return battlePassMapPackIds.map(id => {
        const existing = progressMap.get(id);
        if (existing) {
            return existing;
        }
        return {
            battlePassMapPackId: id,
            userID: userId,
            progress: 0,
            claimed: false
        };
    });
}

export async function getBatchMapPackLevelProgress(
    levels: { mapPackId: number; levelID: number }[],
    userId: string
) {
    if (levels.length === 0) {
        return [];
    }

    const mapPackIds = [...new Set(levels.map(l => l.mapPackId))];
    const { data, error } = await (supabase as any)
        .from('battlePassMapPackLevelProgress')
        .select('*')
        .eq('userID', userId)
        .in('battlePassMapPackId', mapPackIds);

    if (error) {
        throw new Error(error.message);
    }

    const progressMap = new Map<string, any>();

    (data as any[])?.forEach((p: any) => {
        const key = `${p.battlePassMapPackId}_${p.levelID}`;
        progressMap.set(key, p);
    });

    return levels.map(({ mapPackId, levelID }) => {
        const key = `${mapPackId}_${levelID}`;
        const existing = progressMap.get(key);
        if (existing) {
            return existing;
        }
        return {
            battlePassMapPackId: mapPackId,
            levelID,
            userID: userId,
            progress: 0
        };
    });
}

export async function updateMapPackLevelProgress(
    battlePassMapPackId: number,
    levelID: number,
    userId: string,
    progress: number
) {
    const { error } = await (supabase as any)
        .from('battlePassMapPackLevelProgress')
        .upsert({
            battlePassMapPackId,
            levelID,
            userID: userId,
            progress
        });

    if (error) {
        throw new Error(error.message);
    }
}

export async function batchUpdateMapPackLevelProgress(
    mapPackIds: number[],
    levelID: number,
    userId: string,
    progress: number
) {
    if (mapPackIds.length === 0) return;

    const { data: existingRows, error: existingError } = await (supabase as any)
        .from('battlePassMapPackLevelProgress')
        .select('battlePassMapPackId, progress')
        .eq('userID', userId)
        .eq('levelID', levelID)
        .in('battlePassMapPackId', mapPackIds);

    if (existingError) {
        throw new Error(existingError.message);
    }

    const existingMap = new Map<number, number>();
    (existingRows as any[] | null | undefined)?.forEach(row => {
        existingMap.set(row.battlePassMapPackId, row.progress ?? 0);
    });

    const records = mapPackIds
        .filter(mapPackId => {
            const current = existingMap.get(mapPackId) ?? 0;
            return progress > current;
        })
        .map(mapPackId => ({
            battlePassMapPackId: mapPackId,
            levelID,
            userID: userId,
            progress
        }));

    if (records.length === 0) return;

    const { error } = await (supabase as any)
        .from('battlePassMapPackLevelProgress')
        .upsert(records);

    if (error) {
        throw new Error(error.message);
    }
}

export async function batchUpdatePlayerMapPackProgress(mapPackIds: number[], userId: string) {
    if (mapPackIds.length === 0) return;

    // 1. Fetch Map Pack details + existing progress via join
    const { data: bpMapPacks, error: fetchError } = await supabase
        .from('battlePassMapPacks')
        .select('id, seasonId, mapPacks(*, mapPackLevels(*)), battlePassMapPackProgress!left(userID, claimed)')
        .in('id', mapPackIds)
        .or(`userID.eq.${userId},userID.is.null`, { foreignTable: 'battlePassMapPackProgress' });

    if (fetchError) {
        throw new Error(fetchError.message);
    }

    if (!bpMapPacks || bpMapPacks.length === 0) return;

    // 2. Fetch level progress for all these map packs
    const { data: levelsProgress, error: levelsError } = await supabase
        .from('battlePassMapPackLevelProgress')
        .select('battlePassMapPackId, progress')
        .in('battlePassMapPackId', mapPackIds)
        .eq('userID', userId);

    if (levelsError) {
        throw new Error(levelsError.message);
    }

    // Map existing progress by ID for easy lookup (from join)
    const existingProgressMap = new Map<number, boolean>();
    bpMapPacks?.forEach((p: any) => {
        const rows = p.battlePassMapPackProgress as { userID: string; claimed: boolean }[] | null | undefined;
        const claimed = rows?.find(r => r.userID === userId)?.claimed ?? false;
        existingProgressMap.set(p.id, claimed);
    });

    // Map levels progress by battlePassMapPackId
    const levelsProgressMap = new Map<number, number>(); // ID -> total sum
    levelsProgress?.forEach(p => {
        const current = levelsProgressMap.get(p.battlePassMapPackId) || 0;
        levelsProgressMap.set(p.battlePassMapPackId, current + (p.progress || 0));
    });

    const updates = [];
    const xpAwards = [];

    // 4. Calculate updates
    for (const bpMapPack of bpMapPacks) {
        const mapPackId = bpMapPack.id;
        const totalLevels = bpMapPack.mapPacks?.mapPackLevels?.length || 0;
        const totalProgressSum = levelsProgressMap.get(mapPackId) || 0;

        // Formula: (total progress in battlePassMapPackLevelProgress) / (100 * count of mapPackLevels level)
        const overallProgress = totalLevels > 0 ? totalProgressSum / (100 * totalLevels) : 0;

        const existingClaimed = existingProgressMap.get(mapPackId) || false;
        const isFullyCompleted = overallProgress >= 1;
        const shouldClaim = isFullyCompleted && !existingClaimed;

        updates.push({
            battlePassMapPackId: mapPackId,
            userID: userId,
            progress: overallProgress * 100,
            claimed: shouldClaim ? true : existingClaimed
        });

        if (shouldClaim) {
            const mapPackXp = bpMapPack.mapPacks?.xp || 0;
            if (mapPackXp > 0) {
                xpAwards.push({
                    seasonId: bpMapPack.seasonId,
                    userId,
                    xp: mapPackXp,
                    source: 'mappack_auto',
                    refId: mapPackId,
                    description: `Auto-completed map pack: ${bpMapPack.mapPacks?.name || 'Unknown'}`
                });
            }
        }
    }

    // 5. Batch upsert
    if (updates.length > 0) {
        const { error: upsertError } = await supabase
            .from('battlePassMapPackProgress')
            .upsert(updates);

        if (upsertError) {
            throw new Error(upsertError.message);
        }
    }

    // 6. Award XP
    for (const award of xpAwards) {
        await addXp(
            award.seasonId,
            award.userId,
            award.xp,
            award.source,
            award.refId,
            award.description
        );
    }
}

export async function getMapPackIdsForLevel(seasonId: number, levelID: number) {
    const { data, error } = await supabase
        .from('battlePassMapPacks')
        .select('id, mapPackId, mapPacks!inner(mapPackLevels!inner(levelID))')
        .eq('seasonId', seasonId)
        .eq('mapPacks.mapPackLevels.levelID', levelID);

    if (error) {
        throw new Error(error.message);
    }

    return data?.map(d => d.id) || [];
}

export async function trackProgressAfterDeathCount(
    uid: string,
    levelIDNum: number,
    setCompleted: boolean,
    player: Awaited<ReturnType<typeof fetchPlayerDeathCount>>
) {

    const progressPercent = setCompleted ? 100 : getDeathCountProgress(player.count);
    const finalProgress = setCompleted && player.completedTime ? 100 : progressPercent;
    const season = await getActiveseason();
    let battlePassLevelIdForCourseSync: number | null = null;

    if (!season) {
        return;
    }

    try {
        // Update battlepass level progress (both partial and complete)
        const bpLevel = await getActiveBattlePassLevelByLevelID(levelIDNum);

        if (bpLevel) {
            battlePassLevelIdForCourseSync = bpLevel.id;

            await updatePlayerLevelProgress(bpLevel.id, uid, finalProgress);

            // Check and award XP if milestones are reached
            const bpProgress = await getPlayerLevelProgress(bpLevel.id, uid);

            if (bpProgress && progressPercent > bpProgress.progress) {
                // Min progress reward
                if (bpLevel.minProgress > 0 && finalProgress >= bpLevel.minProgress && !bpProgress.minProgressClaimed) {
                    await addXp(
                        bpLevel.seasonId,
                        uid,
                        bpLevel.minProgressXp,
                        'level_min_progress',
                        bpLevel.id,
                        `Level ${bpLevel.levelID} min progress reward`
                    );

                    await supabase
                        .from('battlePassLevelProgress')
                        .update({ minProgressClaimed: true })
                        .eq('battlePassLevelId', bpLevel.id)
                        .eq('userID', uid);
                }

                // Completion reward
                if (finalProgress >= 100 && !bpProgress.completionClaimed) {
                    const xpAmount = bpLevel.xp - bpLevel.minProgressXp;
                    if (xpAmount > 0) {
                        await addXp(
                            bpLevel.seasonId,
                            uid,
                            xpAmount,
                            'level_completion',
                            bpLevel.id,
                            `Level ${bpLevel.levelID} completion reward`
                        );
                    }

                    await supabase
                        .from('battlePassLevelProgress')
                        .update({ completionClaimed: true })
                        .eq('battlePassLevelId', bpLevel.id)
                        .eq('userID', uid);
                }
            }
        }
    } catch { }

    const mapPackIds = await getMapPackIdsForLevel(season.id, levelIDNum);

    try {
        await batchUpdateMapPackLevelProgress(
            mapPackIds,
            levelIDNum,
            uid,
            finalProgress
        );
    } catch (error: any) {
        console.error(`Failed to update map pack level progress:`, error.message);
    }

    // Always update map pack progress
    try {
        await batchUpdatePlayerMapPackProgress(mapPackIds, uid);
    } catch (error: any) {
        console.error(`Failed to update map pack progress:`, error.message);
    }

    try {
        await updateCourseProgress(season.id, uid, levelIDNum, finalProgress);
    } catch (error: any) {
        console.error(`Failed to sync course progress:`, error.message);
    }

}

// ==================== Mission Refresh Functions ====================

export type RefreshType = 'none' | 'daily' | 'weekly';

/**
 * Get missions that need to be refreshed based on refresh type
 * Daily: Reset at 0:00 AM UTC+7
 * Weekly: Reset at Monday 0:00 AM UTC+7
 */
export async function getMissionsToRefresh(refreshType: RefreshType) {
    const { data, error } = await supabase
        .from('battlePassMissions')
        .select('*, battlePassSeasons!inner(*)')
        .eq('refreshType', refreshType)
        .eq('battlePassSeasons.isArchived', false);

    if (error) {
        throw new Error(error.message);
    }

    // Filter to only active seasons
    const now = new Date();
    return data?.filter(mission => {
        const season = mission.battlePassSeasons;
        return new Date(season.start) <= now && new Date(season.end) >= now;
    }) || [];
}

/**
 * Refresh a specific mission - removes all progress and claims for that mission
 */
export async function refreshMission(missionId: number) {
    // Delete all mission claims for this mission
    const { error: claimsError } = await supabase
        .from('battlePassMissionClaims')
        .delete()
        .eq('missionId', missionId);

    if (claimsError) {
        console.error(`Failed to delete claims for mission ${missionId}:`, claimsError.message);
        throw new Error(claimsError.message);
    }

    // Delete all mission progress for this mission
    const { error: progressError } = await supabase
        .from('battlePassMissionProgress')
        .delete()
        .eq('missionId', missionId);

    if (progressError) {
        console.error(`Failed to delete progress for mission ${missionId}:`, progressError.message);
        throw new Error(progressError.message);
    }

    return { missionId, refreshed: true };
}

/**
 * Refresh all missions of a specific type (daily or weekly)
 * Called by the cron webhook
 */
export async function refreshMissionsByType(refreshType: RefreshType) {
    if (refreshType === 'none') {
        return { refreshed: 0, missions: [] };
    }

    const missions = await getMissionsToRefresh(refreshType);
    const results = [];

    for (const mission of missions) {
        try {
            await refreshMission(mission.id);
            results.push({ id: mission.id, title: mission.title, success: true });
        } catch (error: any) {
            results.push({ id: mission.id, title: mission.title, success: false, error: error.message });
        }
    }

    return {
        refreshed: results.filter(r => r.success).length,
        total: missions.length,
        missions: results
    };
}

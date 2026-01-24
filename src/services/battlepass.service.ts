import supabase from "@src/client/supabase";
import type { TablesInsert } from "@src/types/supabase";
import { addInventoryItem } from "@src/services/inventory.service";
import { SubscriptionType } from "@src/const/subscriptionTypeConst";
import { getDeathCountProgress } from "@src/services/death-count.service";

const XP_PER_TIER = 100;
const MAX_TIER = 100;
const COMPLETION_THRESHOLD = 100;

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
        .maybeSingle();

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
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
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
            // Find all battlePassMapPacks for this season that reference these mapPacks
            for (const mpl of mapPackLevels) {
                const { data: bpMapPacks } = await supabase
                    .from('battlePassMapPacks')
                    .select('id')
                    .eq('seasonId', bpLevel.seasonId)
                    .eq('mapPackId', mpl.mapPackId);

                if (bpMapPacks && bpMapPacks.length > 0) {
                    for (const bpmp of bpMapPacks) {
                        await completeMapPackLevel(bpmp.id, userId, mpl.levelID);
                    }
                }
            }
        }
    }

    // Check and update mission progress
    await checkAndUpdateMissionProgress(bpLevel.seasonId, userId);

    return { battlePassLevelId, progress };
}

// Check all missions for the season and mark as completed if conditions are met
export async function checkAndUpdateMissionProgress(seasonId: number, userId: string) {
    const missions = await getSeasonMissions(seasonId);

    // Process missions in parallel for better performance
    await Promise.allSettled(missions.map(async (mission) => {
        // Skip if already claimed
        const claimed = await isMissionClaimed(userId, mission.id);
        if (claimed) return;

        // Skip if already marked as completed
        const existingProgress = await getMissionProgress(userId, mission.id);
        if (existingProgress?.completed) return;

        // Check if mission conditions are met
        const isCompleted = await isMissionCompleted(userId, mission.id);
        if (isCompleted) {
            await setMissionCompleted(userId, mission.id);
        }
    }));
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
        .lte('unlockWeek', weeksSinceStart + 1)
        .order('unlockWeek', { ascending: false })
        .order('order', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getAllSeasonMapPacks(seasonId: number) {
    const { data, error } = await supabase
        .from('battlePassMapPacks')
        .select('*, mapPacks(*, mapPackLevels(*, levels(*)))')
        .eq('seasonId', seasonId)
        .order('unlockWeek', { ascending: true })
        .order('order', { ascending: true });

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
    // Push all map packs with order >= new order by 1
    if (bpMapPack.order !== undefined && bpMapPack.seasonId !== undefined) {
        // Get all map packs that need to be shifted
        const { data: mapPacksToShift, error: fetchError } = await supabase
            .from('battlePassMapPacks')
            .select('id, order')
            .eq('seasonId', bpMapPack.seasonId)
            .gte('order', bpMapPack.order);

        if (fetchError) {
            throw new Error(fetchError.message);
        }

        // Update each map pack by incrementing its order
        for (const mapPack of mapPacksToShift || []) {
            const { error: updateError } = await supabase
                .from('battlePassMapPacks')
                .update({ order: mapPack.order + 1 })
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
    if (updates.order !== undefined) {
        const { data: currentMapPack, error: fetchError } = await supabase
            .from('battlePassMapPacks')
            .select('seasonId, order')
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
    const progress = await getPlayerMapPackProgress(battlePassMapPackId, userId);
    const completedLevels = progress?.completedLevels || [];

    if (!completedLevels.includes(levelId)) {
        completedLevels.push(levelId);
    }

    const { error } = await supabase
        .from('battlePassMapPackProgress')
        .upsert({
            battlePassMapPackId,
            userID: userId,
            completedLevels,
            claimed: progress?.claimed || false
        });

    if (error) {
        throw new Error(error.message);
    }

    return completedLevels;
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

    const totalLevels = bpMapPack.mapPacks?.mapPackLevels?.length || 0;

    if (progress.completedLevels.length < totalLevels) {
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

                const bpMapPack = await getBattlePassMapPack(condition.targetId);
                const totalLevels = bpMapPack.mapPacks?.mapPackLevels?.length || 0;

                if (progress.completedLevels.length < totalLevels) return false;
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

                // Count completed map pack levels
                for (const pack of bpMapPacks) {
                    const packProgress = await getPlayerMapPackProgress(pack.id, userId);
                    if (packProgress) {
                        completedCount += packProgress.completedLevels.length;
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
                        if (packProgress.completedLevels.length >= totalLevels) {
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
            completedLevels: [],
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
    arr: number[],
    setCompleted: boolean,
    player: any
) {
    const progressPercent = getDeathCountProgress(arr);

    if (setCompleted && player.completedTime) {
        const bpLevel = await getActiveBattlePassLevelByLevelID(levelIDNum);
        if (bpLevel) {
            await updateLevelProgressWithMissionCheck(bpLevel.id, uid, 100);
        }
    }

    const season = await getActiveseason();

    if (season) {
        const mapPackIds = await getMapPackIdsForLevel(season.id, levelIDNum);
        for (const mapPackId of mapPackIds) {
            await updateMapPackLevelProgress(
                mapPackId, 
                levelIDNum, 
                uid, 
                setCompleted ? 100 : progressPercent
            );
        }
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

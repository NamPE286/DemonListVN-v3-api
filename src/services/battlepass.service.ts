import supabase from "@src/client/supabase";
import type { TablesInsert } from "@src/types/supabase";
import { addInventoryItem } from "@src/services/inventory.service";

const XP_PER_TIER = 100;
const MAX_TIER = 100;

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

    if (!data) {
        return {
            seasonId,
            userID: userId,
            xp: 0,
            isPremium: false,
            tier: 0
        };
    }

    return {
        ...data,
        tier: calculateTier(data.xp)
    };
}

export async function addXp(seasonId: number, userId: string, xp: number) {
    const progress = await getPlayerProgress(seasonId, userId);
    const newXp = (progress?.xp || 0) + xp;

    const { error } = await supabase
        .from('battlePassProgress')
        .upsert({
            seasonId,
            userID: userId,
            xp: newXp,
            isPremium: progress?.isPremium || false
        });

    if (error) {
        throw new Error(error.message);
    }

    return {
        previousXp: progress?.xp || 0,
        newXp,
        previousTier: calculateTier(progress?.xp || 0),
        newTier: calculateTier(newXp)
    };
}

export async function upgradeToPremium(seasonId: number, userId: string) {
    // Get existing progress to preserve XP
    const existingProgress = await getPlayerProgress(seasonId, userId);
    
    const { error } = await supabase
        .from('battlePassProgress')
        .upsert({
            seasonId,
            userID: userId,
            xp: existingProgress?.xp || 0,
            isPremium: true
        }, {
            onConflict: 'seasonId,userID'
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

// ==================== Map Pack Functions ====================

export async function getSeasonMapPacks(seasonId: number) {
    const now = new Date();
    const season = await getSeason(seasonId);
    const seasonStart = new Date(season.start);
    const weeksSinceStart = Math.max(0, Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    const { data, error } = await supabase
        .from('battlePassMapPacks')
        .select('*, battlePassMapPackLevels(*, levels(*))')
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
        .select('*, battlePassMapPackLevels(*, levels(*))')
        .eq('seasonId', seasonId)
        .order('unlockWeek', { ascending: true })
        .order('order', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getMapPack(mapPackId: number) {
    const { data, error } = await supabase
        .from('battlePassMapPacks')
        .select('*, battlePassMapPackLevels(*, levels(*))')
        .eq('id', mapPackId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function createMapPack(mapPack: TablesInsert<"battlePassMapPacks">) {
    const { data, error } = await supabase
        .from('battlePassMapPacks')
        .insert(mapPack)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateMapPack(mapPackId: number, updates: Partial<TablesInsert<"battlePassMapPacks">>) {
    const { error } = await supabase
        .from('battlePassMapPacks')
        .update(updates)
        .eq('id', mapPackId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function deleteMapPack(mapPackId: number) {
    const { error } = await supabase
        .from('battlePassMapPacks')
        .delete()
        .eq('id', mapPackId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function addMapPackLevel(level: TablesInsert<"battlePassMapPackLevels">) {
    const { data, error } = await supabase
        .from('battlePassMapPackLevels')
        .insert(level)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function deleteMapPackLevel(levelId: number) {
    const { error } = await supabase
        .from('battlePassMapPackLevels')
        .delete()
        .eq('id', levelId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function getPlayerMapPackProgress(mapPackId: number, userId: string) {
    const { data, error } = await supabase
        .from('battlePassMapPackProgress')
        .select('*')
        .eq('mapPackId', mapPackId)
        .eq('userID', userId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function completeMapPackLevel(mapPackId: number, userId: string, levelId: number) {
    const progress = await getPlayerMapPackProgress(mapPackId, userId);
    const completedLevels = progress?.completedLevels || [];
    
    if (!completedLevels.includes(levelId)) {
        completedLevels.push(levelId);
    }

    const { error } = await supabase
        .from('battlePassMapPackProgress')
        .upsert({
            mapPackId,
            userID: userId,
            completedLevels,
            claimed: progress?.claimed || false
        });

    if (error) {
        throw new Error(error.message);
    }

    return completedLevels;
}

export async function claimMapPackReward(mapPackId: number, userId: string) {
    const mapPack = await getMapPack(mapPackId);
    const progress = await getPlayerMapPackProgress(mapPackId, userId);
    
    if (!progress) {
        throw new Error('No progress found');
    }

    if (progress.claimed) {
        throw new Error('Already claimed');
    }

    const totalLevels = mapPack.battlePassMapPackLevels?.length || 0;
    
    if (progress.completedLevels.length < totalLevels) {
        throw new Error('Map pack not completed');
    }

    const { error } = await supabase
        .from('battlePassMapPackProgress')
        .update({ claimed: true })
        .eq('mapPackId', mapPackId)
        .eq('userID', userId);

    if (error) {
        throw new Error(error.message);
    }

    // Add XP to player
    await addXp(mapPack.seasonId, userId, mapPack.xp);

    return mapPack.xp;
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
    
    const conditions: MissionCondition[] = mission.condition as MissionCondition[];

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
                // Check if user has cleared all levels in a map pack
                if (!condition.targetId) {
                    console.error(`Mission ${missionId}: clear_mappack condition missing targetId`);
                    return false;
                }
                const progress = await getPlayerMapPackProgress(condition.targetId, userId);
                if (!progress) return false;
                
                const mapPack = await getMapPack(condition.targetId);
                const totalLevels = mapPack.battlePassMapPackLevels?.length || 0;
                
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
                const mapPacks = await getAllSeasonMapPacks(mission.seasonId);
                
                let completedCount = 0;
                
                // Count completed battle pass levels
                for (const level of seasonLevels) {
                    const levelProgress = await getPlayerLevelProgress(level.id, userId);
                    if (levelProgress && levelProgress.progress >= 100) {
                        completedCount++;
                    }
                }
                
                // Count completed map pack levels
                for (const pack of mapPacks) {
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
                const mapPacks = await getAllSeasonMapPacks(mission.seasonId);
                let completedPackCount = 0;
                
                for (const pack of mapPacks) {
                    const packProgress = await getPlayerMapPackProgress(pack.id, userId);
                    if (packProgress) {
                        const totalLevels = pack.battlePassMapPackLevels?.length || 0;
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

    // Check if mission is completed
    const isCompleted = await isMissionCompleted(userId, missionId);
    if (!isCompleted) {
        throw new Error('Mission not completed');
    }

    const mission = await getMission(missionId);

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

    // Add XP to player
    await addXp(mission.seasonId, userId, mission.xp);

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
    const status = [];

    for (const mission of missions) {
        const claimed = await isMissionClaimed(userId, mission.id);
        let completed = false;

        if (!claimed) {
            try {
                completed = await isMissionCompleted(userId, mission.id);
            } catch (err) {
                console.error(`Error checking mission ${mission.id} completion for user ${userId}:`, err);
                completed = false;
            }
        }

        status.push({
            ...mission,
            claimed,
            completed: claimed || completed,
            claimable: !claimed && completed
        });
    }

    return status;
}

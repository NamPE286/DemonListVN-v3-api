import supabase from "@src/client/supabase";
import { getEventSubmissions } from "@src/services/event.service";
import type { Tables } from "@src/types/supabase";

export async function getEventQuests(eventId: number) {
    const { data, error } = await supabase
        .from('eventQuests')
        .select('*, rewards:eventQuestRewards(expireAfter, reward:items(*))')
        .eq('eventId', eventId)
        .order('id');

    if (error) {
        throw new Error(error.message)
    }

    const quests = data.map(q => ({
        ...q,
        rewards: q.rewards.map((r) => ({
            ...r.reward,
            expireAfter: r.expireAfter
        }))
    }));

    return quests
}

export async function getEventQuest(questId: number) {
    const { data, error } = await supabase
        .from('eventQuests')
        .select('*, rewards:eventQuestRewards(expireAfter, reward:items(*))')
        .eq('id', questId)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    const quest = {
        ...data,
        rewards: (data.rewards || []).map((r) => ({
            ...r.reward,
            expireAfter: r.expireAfter || r.reward!.defaultExpireAfter
        }))
    }

    return quest
}

export async function createEventQuest(eventId: number, title: string, condition: any) {
    const { data, error } = await supabase
        .from('eventQuests')
        .insert({
            eventId,
            title,
            condition
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateEventQuest(questId: number, updates: { title?: string; condition?: any }) {
    const { data, error } = await supabase
        .from('eventQuests')
        .update(updates)
        .eq('id', questId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function deleteEventQuest(questId: number) {
    // First delete all rewards associated with this quest
    await supabase
        .from('eventQuestRewards')
        .delete()
        .eq('questId', questId);

    // Then delete all claims associated with this quest
    await supabase
        .from('eventQuestClaims')
        .delete()
        .eq('questId', questId);

    // Finally delete the quest itself
    const { error } = await supabase
        .from('eventQuests')
        .delete()
        .eq('id', questId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function addQuestReward(questId: number, rewardId: number, expireAfter: number | null = null) {
    if (expireAfter === null) {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', rewardId)
            .single()

        if (!error) {
            expireAfter = data.defaultExpireAfter
        }
    }

    const { data, error } = await supabase
        .from('eventQuestRewards')
        .insert({
            questId,
            rewardId,
            expireAfter
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function removeQuestReward(questId: number, rewardId: number) {
    const { error } = await supabase
        .from('eventQuestRewards')
        .delete()
        .eq('questId', questId)
        .eq('rewardId', rewardId);

    if (error) {
        throw new Error(error.message);
    }
}

export async function isQuestClaimed(user: Tables<"players">, questId: number) {
    const { data, error } = await supabase
        .from('eventQuestClaims')
        .select('*')
        .eq('userId', user.uid!)
        .eq('questId', questId)

    if (!data || !data.length || error) {
        return false;
    }

    return true;
}

export async function isQuestCompleted(user: Tables<"players">, questId: number) {
    const quest = await getEventQuest(questId)
    const submissions = await getEventSubmissions(quest.eventId, user.uid!);
    const attribute = new Map<string, number>()

    attribute.set('total_point', (submissions || [])
        .filter((s: any) => s && s.accepted)
        .reduce((acc: number, s: any) => {
            const prog = Number(s.progress ?? 0)
            const point = Number(s.eventLevels?.point ?? 0)

            return acc + (prog * point) / 100
        }, 0))

    interface Condition {
        type: string,
        value: number,
        attribute: string
    }

    //@ts-ignore
    const conditions: Condition[] = quest.condition

    for (const condition of conditions) {
        const value = attribute.get(condition.attribute)

        if (value === undefined || value === null) {
            throw new Error('Attribute not exists')
        }

        if (condition.type == 'min') {
            if (value < condition.value) {
                return false;
            }
        }
    }

    return true;
}
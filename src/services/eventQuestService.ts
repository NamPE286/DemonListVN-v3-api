import supabase from "@src/database/supabase";
import type Player from "@src/lib/classes/Player";
import { getEventSubmissions } from "@src/services/eventClientService";

export async function getEventQuests(eventId: number) {
    const { data, error } = await supabase
        .from('eventQuests')
        .select('*, rewards:eventQuestRewards(expireAfter, reward:items(*))')
        .eq('eventId', eventId)
        .order('id');

    if (error) {
        throw error
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
        throw error
    }

    const quest = {
        ...data,
        rewards: (data.rewards || []).map((r) => ({
            ...r.reward,
            expireAfter: r.expireAfter
        }))
    }

    return quest
}

export async function isQuestClaimed(user: Player, questId: number) {
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

export async function isQuestCompleted(user: Player, questId: number) {
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

        if (!value) {
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
import supabase from "@src/database/supabase";

export async function getEventQuests(eventId: number) {
    const { data, error } = await supabase
        .from('eventQuests')
        .select('*, rewards:eventQuestRewards(reward:items(*))')
        .eq('eventId', eventId);
    if (error) {
        throw error
    }

    const quests = data.map(q => ({
        ...q,
        rewards: q.rewards.map(r => r.reward)
    }));


    return quests
}

export async function getEventQuest(questId: number) {
    const { data, error } = await supabase
        .from('eventQuests')
        .select('*, rewards:eventQuestRewards(reward:items(*))')
        .eq('id', questId)

    if (error) {
        throw error
    }

    return data
}
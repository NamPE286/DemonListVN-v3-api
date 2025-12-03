import supabase from "@src/database/supabase";
import type Player from "@src/lib/classes/Player";

export class EventQuestService {
    async getEventSubmissions(eventId: number, userID: string) {
        const levels = await this.getEventLevels(eventId)

        const { data, error } = await supabase
            .from("eventRecords")
            .select("*, eventLevels!inner(*)")
            .eq("userID", userID)
            .eq("eventLevels.eventID", eventId)

        if (error) {
            throw error
        }

        return this.formatEventSubmissions(data, levels)
    }

    private async getEventLevels(eventID: number) {
        const { data, error } = await supabase
            .from('eventLevels')
            .select('*, levels(*)')
            .eq("eventID", eventID)
            .order("id")

        if (error) {
            throw error;
        }

        const flattened = data.map(item => {
            const { levels, ...rest } = item;
            const { id: levelsId, ...flattenedLevels } = levels || {};

            return {
                ...rest,
                ...flattenedLevels,
            };
        });

        return flattened
    }

    private formatEventSubmissions(submissions: any[], levels: any[]) {
        const result = []

        while (result.length < levels.length) {
            let found = false;

            for (const record of submissions) {
                if (record.levelID == levels[result.length].id) {
                    result.push(record)
                    found = true;
                    break
                }
            }

            if (!found) {
                result.push(null)
            }
        }

        return result
    }

    async getEventQuests(eventId: number) {
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

    async getEventQuest(questId: number) {
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

    async isQuestClaimed(user: Player, questId: number) {
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

    async isQuestCompleted(user: Player, questId: number) {
        const quest = await this.getEventQuest(questId)
        const submissions = await this.getEventSubmissions(quest.eventId, user.uid!);
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
}

export default new EventQuestService()

// Migrated from src/lib/client/event.ts and src/lib/client/eventQuest.ts
import supabase from '@src/database/supabase'
import eloService from '@src/services/eloService'
import inventoryService from '@src/services/inventoryService'
import type { Tables, TablesInsert } from '@src/lib/types/supabase'
import type Player from '@src/lib/classes/Player'


interface EventFilter {
    search: string;
    eventType: 'all' | 'contest' | 'nonContest';
    contestType: 'all' | 'ranked' | 'unranked'; // all if eventType == 'all' or 'nonContest'
    start: string;
    end: string;
    from: number;
    to: number;
}



export class EventService {
    static EVENT_SELECT_STR = 'id, created_at, start, end, title, description, imgUrl, exp, redirect, minExp, isSupporterOnly, isContest, hidden, isExternal, isRanked'

    private getPenalty(records: any[]) {
        let res: number = 0;

        for (const i of records) {
            if (i == null) {
                continue;
            }

            res += new Date(i.created_at).getTime()
        }

        return res
    }
    
    private formatEventSubmissions(submissions: Tables<"eventRecords">[], levels: Tables<"eventLevels" | "levels">[]) {
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

    async insertEvent(data: Tables<"events">) {
        const { error } = await supabase
            .from("events")
            .insert(data)

        if (error) {
            throw error
        }
    }

    async updateEvent(id: number, data: Tables<"events">) {
        data.id = id;

        const { error } = await supabase
            .from("events")
            .update(data)
            .eq('id', id)

        if (error) {
            throw error
        }
    }

    async updateEventLevel(data: Tables<"eventLevels">) {
        const { error } = await supabase
            .from("eventLevels")
            .update(data)
            .eq('id', data.id)

        if (error) {
            throw error
        }
    }

    async upsertEventLevel(eventID: number, data: Tables<"eventLevels">) {
        data.eventID = eventID;

        const { error } = await supabase
            .from("eventLevels")
            .upsert(data)

        if (error) {
            throw error
        }
    }

    async deleteEventLevel(eventID: number, levelID: number) {
        const { error } = await supabase
            .from("eventLevels")
            .delete()
            .match({ eventID: eventID, levelID: levelID })

        if (error) {
            throw error
        }
    }

    async getEvents(filter: EventFilter) {
        let query = supabase
            .from('events')
            .select(EventService.EVENT_SELECT_STR)
            .eq('hidden', false)

        if (filter.search) {
            query = query.ilike('title', `%${filter.search}%`)
        }

        if (filter.eventType === 'contest') {
            query = query.eq('isContest', true)
        } else if (filter.eventType === 'nonContest') {
            query = query.eq('isContest', false)
        }

        if (filter.eventType !== 'nonContest' && filter.contestType !== 'all') {
            if (filter.contestType === 'ranked') {
                query = query.eq('isRanked', true)
            } else if (filter.contestType === 'unranked') {
                query = query.eq('isRanked', false)
            }
        }

        if (filter.start) {
            query = query.gte('start', filter.start)
        }

        if (filter.end) {
            query = query.lte('end', filter.end)
        }

        const { data, error } = await query
            .order('start', { ascending: false })
            .range(filter.from, filter.to)

        if (error) {
            throw error
        }

        return data;
    }

    async getEvent(id: number) {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .limit(1)
            .single()

        if (error) {
            throw error
        }

        return data
    }

    async getOngoingEvents() {
        const cur = new Date().toISOString()
        var { data, error } = await supabase
            .from('events')
            .select('*')
            .gte('end', cur)
            .eq('hidden', false)
            .order('start', { ascending: false })
        if (error) {
            throw error
        }

        const res = data

        var { data, error } = await supabase
            .from('events')
            .select('*')
            .is('end', null)

        if (error) {
            throw error
        }

        return res?.concat(data!)
    }

    async getEventProof(eventID: number, uid: string) {
        const { data, error } = await supabase
            .from('eventProofs')
            .select('*')
            .match({ eventID: eventID, userid: uid })
            .limit(1)
            .single()

        if (error) {
            throw error;
        }

        return data
    }

    async getEventProofs(eventID: number | null, { start = 0, end = 50, accepted = 'true' } = {}) {
        let query = supabase
            .from('eventProofs')
            .select('*, events!inner(*), players(*)')
            .eq('events.isContest', false)

        if (eventID) {
            query = query.eq('eventID', eventID)
        }

        query = query
            .eq('accepted', accepted == 'true')
            .order('created_at', { ascending: true })
            .range(start, end)

        const { data, error } = await query

        if (error) {
            throw error
        }

        return data
    }

    async upsertEventProof(data: any) {
        const { error } = await supabase
            .from('eventProofs')
            .upsert(data)

        if (error) {
            throw error
        }
    }

    async insertEventProof(data: any) {
        const { error } = await supabase
            .from('eventProofs')
            .insert(data)

        if (error) {
            throw error
        }
    }

    async deleteEventProof(eventID: number, uid: string) {
        const { error } = await supabase
            .from('eventProofs')
            .delete()
            .match({ eventID: eventID, userid: uid })

        if (error) {
            throw error
        }
    }

    async getEventLevels(eventID: number) {
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

    async getEventLevelsSafe(eventID: number) {
        const { data, error } = await supabase
            .from('eventLevels')
            .select('*, levels(*)')
            .eq("eventID", eventID)
            .order("id")

        if (error) {
            throw error;
        }

        const hideLevel = new Set()

        for (let i = 0; i < data.length; i++) {
            if (data[i].requiredLevel) {
                const requiredLevelItem = data.find(item => {
                    return item.id === data[i].requiredLevel
                });

                if (!requiredLevelItem || (requiredLevelItem.point - (requiredLevelItem.totalProgress || 0)) > 0) {
                    hideLevel.add(data[i].id)
                }
            }
        }

        const flattened = data.map(item => {
            if (hideLevel.has(item.id)) {
                return null;
            }

            const { levels, ...rest } = item;
            const { id: levelsId, ...flattenedLevels } = levels || {};

            return {
                ...rest,
                ...flattenedLevels,
            };
        });

        return flattened
    }


    async getEventSubmissions(eventID: number, userID: string) {
        const levels = await this.getEventLevels(eventID)

        const { data, error } = await supabase
            .from("eventRecords")
            .select("*, eventLevels!inner(*)")
            .eq("userID", userID)
            .eq("eventLevels.eventID", eventID)

        if (error) {
            throw error
        }

        return this.formatEventSubmissions(data, levels)
    }

    async get_event_leaderboard(eventID: number, ignoreFreeze: boolean) {
        const event = await this.getEvent(eventID)
        const levels = await this.getEventLevels(eventID)
        const { data, error } = await supabase
            .from("eventProofs")
            .select("userid, eventID, diff, players!inner(*, clans!id(*), eventRecords(*, eventLevels(*)))")
            .eq("eventID", eventID)
            .lte("players.eventRecords.created_at", event.freeze && !ignoreFreeze ? event.freeze : new Date().toISOString());

        if (error) {
            throw error
        }

        const res = []

        for (let i of data) {
            if (!i.players) {
                continue
            }

            if (!i.players.eventRecords === null) {
                i.players.eventRecords = []
            }
            // @ts-ignore
            i.players.diff = i.diff
            res.push(i.players)
        }

        for (const player of res) {
            // @ts-ignore
            player.eventRecords = formatEventSubmissions(player.eventRecords, levels);
        }

        if (event.type === 'raid') {
            res.sort((a, b) => {
                const x = a.eventRecords.reduce((sum, record) => {
                    return sum + (record && (record.accepted === null || record.accepted === true) ? record.progress : 0);
                }, 0);

                const y = b.eventRecords.reduce((sum, record) => {
                    return sum + (record && (record.accepted === null || record.accepted === true) ? record.progress : 0);
                }, 0);

                if (x == y && x != 0) {
                    return this.getPenalty(a.eventRecords) - this.getPenalty(b.eventRecords)
                }

                return y - x;
            });
        } else {
            res.sort((a, b) => {
                const x = a.eventRecords.reduce((sum, record, index) => {
                    return sum + (record && (record.accepted === null || record.accepted === true) ? levels[index].point * record.progress : 0);
                }, 0);

                const y = b.eventRecords.reduce((sum, record, index) => {
                    return sum + (record && (record.accepted === null || record.accepted === true) ? levels[index].point * record.progress : 0);
                }, 0);

                if (x == y && x != 0) {
                    return this.getPenalty(a.eventRecords) - this.getPenalty(b.eventRecords)
                }

                return y - x;
            });
        }

        return res
    }

    async deleteEventSubmission(levelID: number, userID: string) {
        const { error } = await supabase
            .from('eventRecords')
            .delete()
            .match({ userID: userID, levelID: levelID })

        if (error) {
            throw error
        }
    }

    async insertEventSubmission(submission: any) {
        var { error } = await supabase
            .from("eventRecords")
            .insert(submission)

        if (error) {
            throw error
        }

        var { data, error } = await supabase
            .from("eventLevels")
            .select("id, eventID")
            .eq("id", submission.levelID)
            .single()

        if (error) {
            throw error
        }

        try {
            await this.insertEventProof({
                userid: submission.userID,
                eventID: data?.eventID
            })
        } catch (err) {
            console.warn(err)
        }
    }

    async upsertEventSubmission(submission: any) {
        var { error } = await supabase
            .from("eventRecords")
            .upsert(submission)
    }


    // Functions from eventQuest.ts

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

const eventServiceInstance = new EventService()

// Re-export functions for compatibility
export const getEvents = eventServiceInstance.getEvents.bind(eventServiceInstance)
export const getOngoingEvents = eventServiceInstance.getOngoingEvents.bind(eventServiceInstance)
export const getEventProofs = eventServiceInstance.getEventProofs.bind(eventServiceInstance)
export const getEventLevelsSafe = eventServiceInstance.getEventLevelsSafe.bind(eventServiceInstance)
export const EVENT_SELECT_STR = EventService.EVENT_SELECT_STR

export default eventServiceInstance

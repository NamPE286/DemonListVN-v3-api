import supabase from '@src/database/supabase'
import eloService from '@src/services/eloService'
import eventQuestService from '@src/services/eventQuestService'
import inventoryService from '@src/services/inventoryService'
import type { Tables } from "@src/lib/types/supabase"

export const EVENT_SELECT_STR = 'id, created_at, start, end, title, description, imgUrl, exp, redirect, minExp, isSupporterOnly, isContest, hidden, isExternal, isRanked'

interface EventFilter {
    search: string
    eventType: 'all' | 'contest' | 'nonContest'
    contestType: 'all' | 'ranked' | 'unranked'
    start: string
    end: string
    from: number
    to: number
}

class EventService {
    private getPenalty(records: any[]) {
        let res: number = 0

        for (const i of records) {
            if (i == null) {
                continue
            }

            res += new Date(i.created_at).getTime()
        }

        return res
    }

    private formatEventSubmissions(submissions: Tables<"eventRecords">[], levels: Tables<"eventLevels" | "levels">[]) {
        const result = []

        while (result.length < levels.length) {
            let found = false

            for (const record of submissions) {
                if (record.levelID == levels[result.length].id) {
                    result.push(record)
                    found = true
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
        data.id = id

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
        data.eventID = eventID

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
            .select(EVENT_SELECT_STR)
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

        return data
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
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .gte('end', cur)
            .eq('hidden', false)
            .order('start', { ascending: false })

        if (error) {
            throw error
        }

        const res = data

        const { data: data2, error: error2 } = await supabase
            .from('events')
            .select('*')
            .is('end', null)

        if (error2) {
            throw error2
        }

        return res?.concat(data2!)
    }

    async getEventProof(eventID: number, uid: string) {
        const { data, error } = await supabase
            .from('eventProofs')
            .select('*')
            .match({ eventID: eventID, userid: uid })
            .limit(1)
            .single()

        if (error) {
            throw error
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
            throw error
        }

        const flattened = data.map(item => {
            const { levels, ...rest } = item
            const { id: levelsId, ...flattenedLevels } = levels || {}

            return {
                ...rest,
                ...flattenedLevels,
            }
        })

        return flattened
    }

    async getEventLevelsSafe(eventID: number) {
        const { data, error } = await supabase
            .from('eventLevels')
            .select('*, levels(*)')
            .eq("eventID", eventID)
            .order("id")

        if (error) {
            throw error
        }

        const hideLevel = new Set()

        for (let i = 0; i < data.length; i++) {
            if (data[i].requiredLevel) {
                const requiredLevelItem = data.find(item => {
                    return item.id === data[i].requiredLevel
                })

                if (!requiredLevelItem || (requiredLevelItem.point - (requiredLevelItem.totalProgress || 0)) > 0) {
                    hideLevel.add(data[i].id)
                }
            }
        }

        const flattened = data.map(item => {
            if (hideLevel.has(item.id)) {
                return null
            }

            const { levels, ...rest } = item
            const { id: levelsId, ...flattenedLevels } = levels || {}

            return {
                ...rest,
                ...flattenedLevels,
            }
        })

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

    async get_event_leaderboard(eventID: number, ignoreFreeze: boolean = false) {
        const event = await this.getEvent(eventID)
        const levels = await this.getEventLevels(eventID)
        const { data, error } = await supabase
            .from("eventProofs")
            .select("userid, eventID, diff, players!inner(*, clans!id(*), eventRecords(*, eventLevels(*)))")
            .eq("eventID", eventID)
            .lte("players.eventRecords.created_at", event.freeze && !ignoreFreeze ? event.freeze : new Date().toISOString())

        if (error) {
            throw error
        }

        const res = []

        for (let i of data) {
            if (!i.players) {
                continue
            }

            if (i.players.eventRecords === null || !i.players.eventRecords) {
                i.players.eventRecords = []
            }
            // @ts-ignore
            i.players.diff = i.diff
            res.push(i.players)
        }

        for (const player of res) {
            // @ts-ignore
            player.eventRecords = this.formatEventSubmissions(player.eventRecords, levels)
        }

        if (event.type === 'raid') {
            res.sort((a, b) => {
                const x = a.eventRecords.reduce((sum, record) => {
                    return sum + (record && (record.accepted === null || record.accepted === true) ? record.progress : 0)
                }, 0)

                const y = b.eventRecords.reduce((sum, record) => {
                    return sum + (record && (record.accepted === null || record.accepted === true) ? record.progress : 0)
                }, 0)

                if (x == y && x != 0) {
                    return this.getPenalty(a.eventRecords) - this.getPenalty(b.eventRecords)
                }

                return y - x
            })
        } else {
            res.sort((a, b) => {
                const x = a.eventRecords.reduce((sum, record, index) => {
                    return sum + (record && (record.accepted === null || record.accepted === true) ? levels[index].point * record.progress : 0)
                }, 0)

                const y = b.eventRecords.reduce((sum, record, index) => {
                    return sum + (record && (record.accepted === null || record.accepted === true) ? levels[index].point * record.progress : 0)
                }, 0)

                if (x == y && x != 0) {
                    return this.getPenalty(a.eventRecords) - this.getPenalty(b.eventRecords)
                }

                return y - x
            })
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
        const { error } = await supabase
            .from("eventRecords")
            .insert(submission)

        if (error) {
            throw error
        }

        const { data, error: error2 } = await supabase
            .from("eventLevels")
            .select("id, eventID")
            .eq("id", submission.levelID)
            .single()

        if (error2) {
            throw error2
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
        const { error } = await supabase
            .from("eventRecords")
            .upsert(submission)

        if (error) {
            throw error
        }
    }

    async createEvent(eventData: any) {
        return await this.insertEvent(eventData)
    }

    async upsertProof(proofData: any) {
        return await this.upsertEventProof(proofData)
    }

    async createProof(proofData: any, eventID: number) {
        const event = await this.getEvent(eventID)

        return { event, proof: await this.insertEventProof(proofData) }
    }

    async submitLevel(uid: string, levelID: number, progress: number) {
        const now = new Date().toISOString()
        const { data, error } = await supabase
            .from('eventProofs')
            .select('userid, eventID, events!inner(start, end, type, eventLevels!inner(*, eventRecords(userID, levelID, progress, accepted, videoLink)))')
            .eq('userid', uid)
            .eq('events.eventLevels.levelID', levelID)
            .eq('events.eventLevels.eventRecords.userID', uid)
            .lte('events.start', now)
            .gte('events.end', now)

        if (error) {
            throw error
        }

        for (const i of data!) {
            const levels = await this.getEventLevelsSafe(i.eventID)

            if (!levels.some(level => level && level.levelID === levelID)) {
                throw new Error('Level not found in event')
            }
        }

        interface LevelUpdateData {
            level_id: number,
            gained: number
        }

        const eventRecordUpsertData = []
        const eventLevelUpdateData: LevelUpdateData[] = []

        for (const event of data!) {
            for (const level of event.events?.eventLevels!) {
                let totalProgress = 0

                for (const record of level.eventRecords) {
                    if (record.progress < progress && event.events!.type == 'basic') {
                        // @ts-ignore
                        record.created_at = new Date()
                        record.progress = progress
                        record.videoLink = "Submitted via Geode mod"
                        record.accepted = true

                        eventRecordUpsertData.push(record)
                    }

                    if (event.events!.type == 'raid') {
                        const remainingHP = Math.max(0, level.point - level.totalProgress)

                        // @ts-ignore
                        record.created_at = new Date()

                        let prog = progress
                        let dmg = Math.min(remainingHP, progress * Math.pow(1.0305, progress))

                        if (prog >= level.minEventProgress) {
                            if (prog == 100) {
                                dmg *= 1.5
                            }

                            record.progress += dmg
                            totalProgress += dmg

                            record.videoLink = "Submitted via Geode mod"
                            record.accepted = true

                            eventRecordUpsertData.push(record)
                            eventLevelUpdateData.push({
                                level_id: level.id,
                                gained: dmg
                            })
                        }
                    }
                }
            }
        }

        if (eventRecordUpsertData.length) {
            const { error } = await supabase
                .from('eventRecords')
                .upsert(eventRecordUpsertData)

            if (error) {
                throw error
            }
        }

        if (eventLevelUpdateData.length) {
            for (const i of eventLevelUpdateData) {
                const { error } = await supabase
                    .rpc('update_eventLevel_totalProgress', {
                        level_id: i.level_id,
                        gained: i.gained
                    })

                if (error) {
                    throw error
                }
            }
        }

        return { success: true }
    }

    async checkQuest(uid: string, questId: number) {
        const quest = await eventQuestService.getEventQuest(questId)
        const player = new (await import('@src/lib/classes/Player')).default({ uid })
        await player.pull()
        const isCompleted = await eventQuestService.isQuestCompleted(player, questId)

        return { isCompleted, quest }
    }

    async claimQuest(uid: string, questId: number) {
        const quest = await eventQuestService.getEventQuest(questId)
        const player = new (await import('@src/lib/classes/Player')).default({ uid })
        await player.pull()
        const isClaimed = await eventQuestService.isQuestClaimed(player, questId)

        if (isClaimed) {
            throw new Error('Quest already claimed')
        }

        const isCompleted = await eventQuestService.isQuestCompleted(player, questId)

        if (!isCompleted) {
            throw new Error('Quest not completed')
        }

        await inventoryService.receiveReward(player, quest.reward)

        const { error } = await supabase
            .from('eventQuestClaims')
            .insert({
                userID: uid,
                questID: questId
            })

        if (error) {
            throw error
        }

        return { success: true }
    }

    async getSubmission(submissionId: number) {
        const { data, error } = await supabase
            .from('eventSubmissions')
            .select('*, players(*)')
            .eq('id', submissionId)
            .single()

        if (error) {
            throw error
        }

        return data
    }

    async deleteSubmission(submissionId: number) {
        // First, get the submission to find levelID and userID
        const { data: submission, error: fetchError } = await supabase
            .from('eventRecords')
            .select('levelID, userID')
            .eq('id', submissionId)
            .single()

        if (fetchError) {
            throw fetchError
        }

        if (!submission) {
            throw new Error('Submission not found')
        }

        return await this.deleteEventSubmission(submission.levelID, submission.userID)
    }

    async deleteEvent(id: number) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id)

        if (error) {
            throw error
        }
    }

    async submitRecord(uid: string, eventId: number, submissionData: any) {
        submissionData.userid = uid
        submissionData.eventID = eventId

        const event = await this.getEvent(eventId)
        const levels = await this.getEventLevelsSafe(eventId)

        if (!levels.some(level => level && level.levelID === submissionData.levelID)) {
            throw new Error('Level not in event')
        }

        if (event.end && new Date() >= new Date(event.end)) {
            throw new Error('Event has ended')
        }

        return await this.insertEventSubmission(submissionData)
    }

    async getSubmissionByLevel(eventId: number, levelId: number) {
        const { data, error } = await supabase
            .from('eventSubmissions')
            .select('*, players(*)')
            .eq('eventID', eventId)
            .eq('levelID', levelId)

        if (error) {
            throw error
        }

        return data
    }

    async updateSubmission(uid: string, eventId: number, levelId: number, submissionData: any) {
        submissionData.userid = uid
        submissionData.eventID = eventId
        submissionData.levelID = levelId

        return await this.upsertEventSubmission(submissionData)
    }

    async getLeaderboard(eventId: number) {
        return await this.get_event_leaderboard(eventId)
    }

    async calculateLeaderboard(eventId: number) {
        const event = await this.getEvent(eventId)
        const levels = await this.getEventLevelsSafe(eventId)
        const records = []

        for (const i of levels) {
            const { data, error } = await supabase
                .from('eventRecords')
                .select('*')
                .eq('eventLevelID', i.id)
                .eq('accepted', true)

            if (error) {
                throw error
            }

            for (const j of data) {
                records.push({
                    userID: j.userID,
                    levelID: i.levelID,
                    progress: j.progress
                })
            }
        }

        return await eloService.calcLeaderboard(records)
    }

    async getEventQuests(eventId: number, uid?: string) {
        return await eventQuestService.getEventQuests(eventId)
    }
}

export default new EventService()

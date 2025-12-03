import {
    deleteEventProof,
    getEvent,
    getEventProof,
    getEventProofs,
    insertEventProof,
    upsertEventProof,
    deleteEventSubmission,
    get_event_leaderboard,
    getEventLevels,
    getEventSubmissions,
    insertEventSubmission,
    upsertEventSubmission,
    insertEvent,
    updateEvent,
    upsertEventLevel,
    deleteEventLevel,
    updateEventLevel,
    getEventLevelsSafe,
    EVENT_SELECT_STR,
    getEvents,
    getOngoingEvents
} from '@src/lib/client/event'
import supabase from '@src/database/supabase'
import eloService from '@src/services/eloService'
import { getEventQuest, getEventQuests, isQuestClaimed, isQuestCompleted } from '@src/lib/client/eventQuest'
import inventoryService from '@src/services/inventoryService'

// Re-export constants and functions for use in other services
export { 
    EVENT_SELECT_STR,
    getEventLevelsSafe,
    getEvents,
    getOngoingEvents,
    getEventProofs
}

class EventService {
    async createEvent(eventData: any) {
        return await insertEvent(eventData)
    }

    async upsertProof(proofData: any) {
        return await upsertEventProof(proofData)
    }

    async createProof(proofData: any, eventID: number) {
        const event = await getEvent(eventID)

        return { event, proof: await insertEventProof(proofData) }
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
            const levels = await getEventLevelsSafe(i.eventID)

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
        const quest = await getEventQuest(questId)
        const isCompleted = await isQuestCompleted(uid, quest)

        return { isCompleted, quest }
    }

    async claimQuest(uid: string, questId: number) {
        const quest = await getEventQuest(questId)
        const isClaimed = await isQuestClaimed(uid, questId)

        if (isClaimed) {
            throw new Error('Quest already claimed')
        }

        const isCompleted = await isQuestCompleted(uid, quest)

        if (!isCompleted) {
            throw new Error('Quest not completed')
        }

        // Create Player object from uid for inventoryService
        const Player = (await import('@lib/classes/Player')).default
        const player = new Player({ uid })
        await player.pull()
        
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
        return await deleteEventSubmission(submissionId)
    }

    async getEvent(id: number) {
        return await getEvent(id)
    }

    async updateEvent(id: number, eventData: any) {
        return await updateEvent(id, eventData)
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

    async getEventLevels(eventId: number, uid?: string) {
        return await getEventLevels(eventId, uid)
    }

    async upsertEventLevel(levelData: any) {
        return await upsertEventLevel(levelData)
    }

    async updateEventLevel(levelId: number, levelData: any) {
        return await updateEventLevel(levelId, levelData)
    }

    async deleteEventLevel(levelId: number) {
        return await deleteEventLevel(levelId)
    }

    async getEventSubmissions(eventId: number, start: number, end: number) {
        return await getEventSubmissions(eventId, start, end)
    }

    async submitRecord(uid: string, eventId: number, submissionData: any) {
        submissionData.userid = uid
        submissionData.eventID = eventId

        const event = await getEvent(eventId)
        const levels = await getEventLevelsSafe(eventId)

        if (!levels.some(level => level && level.levelID === submissionData.levelID)) {
            throw new Error('Level not in event')
        }

        if (event.end && new Date() >= new Date(event.end)) {
            throw new Error('Event has ended')
        }

        return await insertEventSubmission(submissionData)
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

        return await upsertEventSubmission(submissionData)
    }

    async getLeaderboard(eventId: number) {
        return await get_event_leaderboard(eventId)
    }

    async getEventProofs(eventId: number, start: number, end: number, uid?: string) {
        return await getEventProofs(eventId, start, end, uid)
    }

    async getEventProof(eventId: number, uid: string) {
        return await getEventProof(eventId, uid)
    }

    async deleteEventProof(eventId: number, uid: string) {
        return await deleteEventProof(eventId, uid)
    }

    async calculateLeaderboard(eventId: number) {
        const event = await getEvent(eventId)
        const levels = await getEventLevelsSafe(eventId)
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
        return await getEventQuests(eventId, uid)
    }
}

export default new EventService()

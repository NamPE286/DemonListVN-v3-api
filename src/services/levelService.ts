import Level from '@lib/classes/Level'
import deathCountService from '@src/services/deathCountService'
import recordService from '@src/services/recordService'
import supabase from '@src/database/supabase'
import { getEventLevelsSafe } from '@src/lib/client/event'

export class LevelService {
    validateLevelId(id: string): number {
        const levelId = parseInt(id)

        if (isNaN(levelId)) {
            throw new Error("Invalid ID (ID should only include numeric character)")
        }

        return levelId
    }

    async updateLevel(data: any) {
        if (!('id' in data)) {
            throw new Error("Missing 'id' property")
        }

        const level = new Level(data)

        await level.update()
    }

    async getLevelById(id: number, fromGD: boolean = false) {
        const level = new Level({ id })

        if (!fromGD) {
            await level.pull()

            return level
        }

        return await level.fetchFromGD()
    }

    async deleteLevel(id: number) {
        const level = new Level({ id })

        await level.delete()
    }

    async getLevelRecords(id: number, query: any) {
        return await recordService.getLevelRecords(id, query)
    }

    async getLevelDeathCount(id: number) {
        return await deathCountService.getLevelDeathCount(id)
    }

    async checkLevelInEvent(levelId: number, userId: string, eventType: string = 'basic') {
        const now = new Date().toISOString()

        const { data, error } = await supabase
            .from('eventProofs')
            .select('userid, eventID, events!inner(start, end, type, eventLevels!inner(levelID))')
            .eq('userid', userId)
            .eq('events.eventLevels.levelID', levelId)
            .eq('events.type', eventType)
            .lte('events.start', now)
            .gte('events.end', now)

        if (error) {
            throw error
        }

        for (const i of data) {
            const levels = await getEventLevelsSafe(i.eventID)

            if (levels.some(level => level && level.levelID === levelId)) {
                return true
            }
        }

        return false
    }
}

export default new LevelService()

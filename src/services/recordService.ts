import Record from '@lib/classes/Record'
import { getRecord, retrieveRecord, changeSuggestedRating, getRecords } from '@src/lib/client/record'
import logger from '@src/utils/logger'
import type Player from '@lib/classes/Player'

export class RecordService {
    async updateRecord(data: any) {
        const record = new Record(data)
        await record.update()
    }

    async deleteRecord(userId: string, levelId: number, user: Player) {
        if (user.uid != userId && !user.isAdmin) {
            throw new Error("Forbidden")
        }

        const record = new Record({ userid: userId, levelid: levelId })
        await record.delete()
        
        logger.log(`${user.name} (${user.uid}) performed DELETE /record/${userId}/${levelId}`)
    }

    async getRecord(userId: string, levelId: number) {
        return await getRecord(userId, levelId)
    }

    async changeSuggestedRating(userId: string, levelId: number, rating: number, user: Player) {
        if (user.uid != userId) {
            throw new Error("Unauthorized")
        }

        return await changeSuggestedRating(userId, levelId, rating)
    }

    async retrieveRecord(user: Player) {
        if (!user.isAdmin && !user.isTrusted) {
            throw new Error("Unauthorized")
        }

        if (user.reviewCooldown && (new Date()).getTime() - new Date(user.reviewCooldown).getTime() < 7200000) {
            throw new Error("Too many requests")
        }

        return await retrieveRecord(user)
    }

    async getRecords(query: any) {
        return await getRecords(query)
    }
}

export default new RecordService()

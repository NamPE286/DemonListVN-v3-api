import { getDeathCount, updateDeathCount } from '@src/lib/client/deathCount'

export class DeathCountService {
    async getDeathCount(uid: string, levelId: number) {
        return await getDeathCount(uid, levelId)
    }

    async updateDeathCount(uid: string, levelId: number, deathCounts: number[]) {
        await updateDeathCount(uid, levelId, deathCounts)
    }
}

export default new DeathCountService()

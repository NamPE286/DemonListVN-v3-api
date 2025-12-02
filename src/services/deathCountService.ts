import supabase from '@src/database/supabase'
import Level from '@src/lib/classes/Level'

export class DeathCountService {
    private async fetchPlayerData(uid: string, levelID: number): Promise<any> {
        const { data, error } = await supabase
            .from('deathCount')
            .select('*')
            .eq('uid', uid)
            .eq('levelID', levelID)
            .limit(1)
            .single()

        if (data == null) {
            return { uid: uid, levelID: levelID, count: Array(100).fill(0) }
        }

        return data
    }

    private async fetchLevelData(levelID: number): Promise<any> {
        const { data, error } = await supabase
            .from('levelDeathCount')
            .select('*')
            .eq('levelID', levelID)
            .limit(1)
            .single()

        if (data == null) {
            return { levelID: levelID, count: Array(100).fill(0) }
        }

        return data
    }

    private async isEligible(levelID: number): Promise<boolean> {
        const level = new Level({ id: levelID })
        const data = await level.fetchFromGD()
        const now = new Date()

        if (data.difficulty === 'Extreme Demon' || data.difficulty === 'Insane Demon') {
            return true
        }

        const a = await supabase
            .from('eventLevels')
            .select('*, events(*)')
            .eq('levelID', levelID)

        if (a.error) {
            return false
        }

        for (const lv of a.data) {
            if (!lv.events) {
                continue
            }

            const { start, end } = lv.events

            if (!end) {
                const startDate = new Date(start)

                if (now >= startDate) {
                    return true
                }
            } else {
                const startDate = new Date(start)
                const endDate = new Date(end)

                if (now >= startDate && now <= endDate) {
                    return true
                }
            }
        }

        return false
    }

    async getDeathCount(uid: string, levelID: number) {
        return await this.fetchPlayerData(uid, levelID)
    }

    async getLevelDeathCount(id: number) {
        return await this.fetchLevelData(id)
    }

    async updateDeathCount(uid: string, levelID: number, arr: number[]) {
        if (!(await this.isEligible(levelID))) {
            throw new Error()
        }

        const player = await this.fetchPlayerData(uid, levelID)
        const level = await this.fetchLevelData(levelID)

        for (let i = 0; i < 100; i++) {
            player.count[i] += arr[i]
            level.count[i] += arr[i]
        }

        await supabase
            .from('deathCount')
            .upsert(player)

        await supabase
            .from('levelDeathCount')
            .upsert(level)
    }
}

export default new DeathCountService()

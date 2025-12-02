import Player from '@lib/classes/Player'
import supabase from '@src/database/supabase'
import { getPlayerRecordRating, getPlayerRecords, getPlayerSubmissions } from '@src/lib/client/record'
import discordService from '@src/services/discordService'
import { EVENT_SELECT_STR } from '@src/lib/client/event'

export class PlayerService {
    // Moved from lib/client/player.ts
    async getPlayers({ province = '', city = '', sortBy = 'rating', ascending = 'true' } = {}) {
        if (province == '') {
            throw new Error('Provinces is required')
        }

        let query = supabase
            .from('players')
            .select('*, clans!id(*)')
            .order(sortBy, { ascending: ascending == 'true', nullsFirst: false })
            .eq('province', province)
            .eq('isHidden', false)

        if (city) {
            query = query.eq('city', city)
        }

        const { data, error } = await query

        if (error) {
            throw error
        }

        return data
    }

    async getDemonListLeaderboard({ start = 0, end = 50, sortBy = 'overallRank', ascending = true } = {}) {
        if (typeof ascending == 'string') {
            ascending = (ascending == 'true')
        }

        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .not('overallRank', 'is', null)
            .eq('isHidden', false)
            .order(sortBy, { ascending: ascending })
            .range(start, end)

        if (error) {
            throw error
        }

        return data
    }

    async getFeaturedListLeaderboard({ start = 0, end = 50, sortBy = 'flrank', ascending = true } = {}) {
        if (typeof ascending == 'string') {
            ascending = (ascending == 'true')
        }

        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .not('flrank', 'is', null)
            .eq('isHidden', false)
            .order(sortBy, { ascending: ascending })
            .range(start, end)

        if (error) {
            throw error
        }

        return data
    }

    async getPlatformerListLeaderboard({ start = 0, end = 50, sortBy = 'plrank', ascending = true } = {}) {
        if (typeof ascending == 'string') {
            ascending = (ascending == 'true')
        }

        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .not('plRating', 'is', null)
            .eq('isHidden', false)
            .order(sortBy, { ascending: ascending })
            .range(start, end)

        if (error) {
            throw error
        }

        return data
    }

    async getPlayersBatch(uid: string[]) {
        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .in('uid', uid)

        if (error) {
            throw error
        }

        return uid.map(id => data.find(player => player.uid === id)).filter(Boolean)
    }

    async getFilteredPlayers(filters: any) {
        return await this.getPlayers(filters)
    }

    async getPlayersByBatch(uids: string[]) {
        return await this.getPlayersBatch(uids)
    }

    async updatePlayer(data: any, user: Player) {
        // Validate and prepare data
        if (!('uid' in data)) {
            if (user.isAdmin) {
                throw new Error("Missing 'uid' property")
            } else {
                data.uid = user.uid
            }
        }

        // Check permissions
        if (user.uid != data.uid && !user.isAdmin) {
            throw new Error("Forbidden")
        }

        const player = new Player(data)

        await player.update()
    }

    async createPlayer(uid: string) {
        const { error } = await supabase
            .from("players")
            .insert({
                uid: uid,
                name: String(new Date().getTime())
            })

        if (error) {
            throw error
        }
    }

    async getPlayerByUidOrName(identifier: string) {
        const player = new Player({})

        if (identifier.startsWith('@')) {
            player.name = identifier.slice(1)
        } else {
            player.uid = identifier
        }

        await player.pull()

        return player
    }

    async getPlayerRecords(uid: string, query: any) {
        const { ratingOnly } = query
        
        if (ratingOnly) {
            return await getPlayerRecordRating(uid)
        }

        return await getPlayerRecords(uid, query)
    }

    // Moved from lib/client/heatmap.ts
    private async fetchHeatmapData(uid: string, year: number): Promise<any> {
        let { data, error } = await supabase
            .from('heatmap')
            .select('*')
            .eq('uid', uid)
            .eq('year', year)
            .limit(1)
            .single()

        if (data == null) {
            return { uid: uid, year: year, days: Array(366).fill(0) }
        }

        return data
    }

    private dayOfYear(year: number, month: number, date: number) {
        let x = new Date(year, 0, 1).getTime()
        let y = new Date(year, month, date).getTime()

        return Math.floor((y - x) / 86400000)
    }

    async getPlayerHeatmap(uid: string, year: number) {
        return await this.fetchHeatmapData(uid, year)
    }

    async updatePlayerHeatmap(uid: string, count: number) {
        const date = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}))
        const data = await this.fetchHeatmapData(uid, date.getFullYear())
        const year = date.getFullYear()
        const month = date.getMonth()
        const day = date.getDate()

        data.days[this.dayOfYear(year, month, day)] += count

        const { error } = await supabase
            .from('heatmap')
            .upsert(data)

        if (error) {
            throw error
        }
    }

    async getPlayerSubmissions(uid: string) {
        return await getPlayerSubmissions(uid)
    }

    async syncPlayerRoles(user: Player) {
        await discordService.syncRoleDLVN(user)
        await discordService.syncRoleGDVN(user)
    }

    async getPlayerMedals(id: string) {
        const player = new Player({ uid: id })

        return await player.getInventoryItems()
    }

    async getPlayerEvents(uid: string) {
        const { data, error } = await supabase
            .from('eventProofs')
            .select(`*, events(${EVENT_SELECT_STR})`)
            .eq('userid', uid)
            .order('events(start)', { ascending: false })

        if (error) {
            throw error
        }

        return data
    }

    async getPlayerCards(uid: string) {
        const { data, error } = await supabase
            .from('cards')
            .select('id, created_at, supporterIncluded, owner, activationDate, name, img')
            .eq('owner', uid)
            .order('activationDate')

        if (error) {
            throw error
        }

        return data
    }
}

export default new PlayerService()


import { getPlayers, getPlayersBatch } from '@src/lib/client/player'
import Player from '@lib/classes/Player'
import supabase from '@src/database/supabase'
import { getHeatmap, updateHeatmap } from '@src/lib/client/heatmap'
import { getPlayerRecordRating, getPlayerRecords, getPlayerSubmissions } from '@src/lib/client/record'
import { syncRoleDLVN, syncRoleGDVN } from '@src/lib/client/discord'
import { EVENT_SELECT_STR } from '@src/lib/client/event'

export class PlayerService {
    async getFilteredPlayers(filters: any) {
        return await getPlayers(filters)
    }

    async getPlayersByBatch(uids: string[]) {
        return await getPlayersBatch(uids)
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

    async getPlayerHeatmap(uid: string, year: number) {
        return await getHeatmap(uid, year)
    }

    async updatePlayerHeatmap(uid: string, count: number) {
        await updateHeatmap(uid, count)
    }

    async getPlayerSubmissions(uid: string) {
        return await getPlayerSubmissions(uid)
    }

    async syncPlayerRoles(user: Player) {
        await syncRoleDLVN(user)
        await syncRoleGDVN(user)
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


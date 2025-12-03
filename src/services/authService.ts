import supabase from '@src/database/supabase'
import discordService from '@src/services/discordService'
import pointercrateService from '@src/services/pointercrateService'
import type Player from '@lib/classes/Player'

export class AuthService {
    async handleDiscordCallback(code: string) {
        const data = await discordService.getAccessToken(code)

        if (data.access_token == undefined) {
            throw new Error('Invalid authorization code')
        }

        return data.access_token
    }

    async linkDiscord(user: Player, token: string) {
        const data = await discordService.getUserByToken(token)

        if (data.id == undefined) {
            throw new Error('Invalid access token')
        }

        const id: string = String(data.id)

        await user.updateDiscord(id)
    }

    async linkPointercrate(userUid: string, token: string) {
        const name = await pointercrateService.getUsernameByToken(token)

        const { error } = await supabase
            .from('players')
            .update({ pointercrate: name })
            .eq('uid', userUid)

        if (error) {
            throw error
        }
    }
}

export default new AuthService()

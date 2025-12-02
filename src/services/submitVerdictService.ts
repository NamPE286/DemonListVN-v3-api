import supabase from '@src/database/supabase'
import Level from '@src/lib/classes/Level'
import Record from '@src/lib/classes/Record'
import { sendNotification } from '@src/services/notificationClientService'
import logger from '@src/utils/logger'
import type Player from '@lib/classes/Player'

export class SubmitVerdictService {
    async submitVerdict(data: any, user: Player) {
        const record = new Record({ userid: data.userid, levelid: data.levelid })

        await record.pull()

        if (record.reviewer != user.uid || (!user.isAdmin && !user.isTrusted)) {
            throw new Error('Unauthorized')
        }

        // Update record
        const { error } = await supabase
            .from('records')
            .update(data)
            .match({ userid: data.userid, levelid: data.levelid })

        if (error) {
            throw error
        }

        // Update review cooldown
        const { error: cooldownError } = await supabase
            .from('players')
            .update({ reviewCooldown: new Date() } as any)
            .match({ uid: user.uid })

        if (cooldownError) {
            throw cooldownError
        }

        // Log and send notifications
        logger.log(`${user.name} (${user.uid}) ${data.needMod ? 'forwarded' : ''}${data.isChecked ? 'accepted' : ''} ${data.levelid} record of ${data.userid}\nReviewer's comment: ${data.reviewerComment}`)

        if (data.isChecked) {
            const level = new Level({ id: parseInt(data.levelid) })

            await level.pull()
            await sendNotification({ to: data.userid, content: `Your ${level.name} (${level.id}) record has been accepted by ${user.name}.`, status: 0 })
        } else if (data.needMod) {
            const level = new Level({ id: parseInt(data.levelid) })

            await level.pull()
            await sendNotification({ to: data.userid, content: `Your ${level.name} (${level.id}) record has been forwarded to moderator team for further inspection by ${user.name}.`, status: 0 })
        }
    }
}

export default new SubmitVerdictService()

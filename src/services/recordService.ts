import Record from '@lib/classes/Record'
import Player from '@lib/classes/Player'
import Level from '@lib/classes/Level'
import supabase from '@src/database/supabase'
import logger from '@src/utils/logger'

export class RecordService {
    async updateRecord(data: any) {
        const record = new Record(data)

        await record.update()
    }

    async deleteRecord(userId: string, levelId: number, user: Player) {
        if (user.uid !== userId && !user.isAdmin) {
            throw new Error("Forbidden")
        }

        const record = new Record({ userid: userId, levelid: levelId })

        await record.delete()
        
        logger.log(`${user.name} (${user.uid}) performed DELETE /record/${userId}/${levelId}`)
    }

    async getDemonListRecords({ start = 0, end = 0, isChecked = false } = {}) {
        let isCheckedBool = isChecked

        if (typeof isChecked === 'string') {
            isCheckedBool = (isChecked === 'true')
        }

        const { data, error } = await supabase
            .from('records')
            .select('*')
            .match({ isChecked: isCheckedBool })
            .not('dlPt', 'is', null)
            .order('timestamp', { ascending: true })
            .range(start, end)

        if (error) {
            throw error
        }

        return data
    }

    async getFeaturedListRecords({ start = 0, end = 0, isChecked = false } = {}) {
        let isCheckedBool = isChecked

        if (typeof isChecked === 'string') {
            isCheckedBool = (isChecked === 'true')
        }

        const { data, error } = await supabase
            .from('records')
            .select('*')
            .match({ isChecked: isCheckedBool })
            .not('flPt', 'is', null)
            .order('timestamp', { ascending: true })
            .range(start, end)

        if (error) {
            throw error
        }

        return data
    }

    async getPlayerRecordRating(uid: string) {
        const { data, error } = await supabase
            .from('records')
            .select('userid, progress, no, levels!inner(id, rating), dlPt')
            .eq('userid', uid)
            .not('dlPt', 'is', null)
            .order('no')

        if (error) {
            throw error
        }

        const res = []

        for (const i of data) {
            res.push({ progress: i.progress, rating: i.levels?.rating! })
        }

        return res
    }

    async getPlayerRecords(uid: string, { start = '0', end = '50', sortBy = 'pt', ascending = 'false', isChecked = 'true' } = {}) {
        let query = supabase
            .from('records')
            .select('*, levels!inner(*)')
            .eq('userid', uid)
            .eq('isChecked', isChecked === 'true')
            .eq('levels.isPlatformer', false)

        let query1 = supabase
            .from('records')
            .select('*, levels!inner(*)')
            .eq('userid', uid)
            .eq('isChecked', isChecked === 'true')

        let query2 = supabase
            .from('records')
            .select('*, levels!inner(*)')
            .eq('userid', uid)
            .eq('isChecked', isChecked === 'true')
            .eq('levels.isPlatformer', true)

        if (sortBy === 'pt') {
            query = query
                .order('dlPt', { ascending: ascending === 'true' })
                .order('timestamp', { ascending: false })
                .not('levels.rating', 'is', null)
                .range(parseInt(start), parseInt(end))

            query1 = query1
                .order('flPt', { ascending: ascending === 'true' })
                .order('timestamp', { ascending: false })
                .not('levels.flTop', 'is', null)
                .range(parseInt(start), parseInt(end))

            query2 = query2
                .order('plPt', { ascending: ascending === 'true' })
                .order('timestamp', { ascending: false })
                .not('levels.rating', 'is', null)
                .range(parseInt(start), parseInt(end))

            return {
                dl: (await query).data,
                fl: (await query1).data,
                pl: (await query2).data
            }
        }

        query = query
            .order(sortBy, { ascending: ascending === 'true' })
            .not('levels.rating', 'is', null)
            .range(parseInt(start), parseInt(end))

        query1 = query1
            .order(sortBy, { ascending: ascending === 'true' })
            .not('levels.flTop', 'is', null)
            .range(parseInt(start), parseInt(end))

        query2 = query2
            .order(sortBy, { ascending: ascending === 'true' })
            .not('levels.plRating', 'is', null)
            .range(parseInt(start), parseInt(end))

        return {
            dl: (await query).data,
            fl: (await query1).data,
            pl: (await query2).data
        }
    }

    async getLevelRecords(id: number, { start = 0, end = 50, isChecked = true } = {}) {
        let isCheckedBool = isChecked

        if (typeof isChecked === 'string') {
            isCheckedBool = (isChecked === 'true')
        }

        const level = new Level({ id: id })
        await level.pull()

        const { data, error } = await supabase
            .from('records')
            .select('*, players!userid!inner(*, clans!id(*)), reviewer:players!reviewer(*, clans!id(*))')
            .eq('players.isHidden', false)
            .eq('levelid', id)
            .eq('isChecked', isCheckedBool)
            .order('progress', { ascending: level.isPlatformer })
            .order('timestamp')
            .range(start, end)

        if (error) {
            throw error
        }

        return data
    }

    async getRecord(userId: string, levelId: number) {
        const { data, error } = await supabase
            .from('records')
            .select('*, players!userid(*, clans!id(*)), reviewer:players!reviewer(*, clans!id(*)), levels(*)')
            .eq('levelid', levelId)
            .eq('userid', userId)
            .limit(1)
            .single()

        if (error) {
            console.error(error)
            throw error
        }

        // @ts-ignore
        return data
    }

    async retrieveRecord(user: Player) {
        if (!user.isAdmin && !user.isTrusted) {
            throw new Error("Unauthorized")
        }

        if (user.reviewCooldown && (new Date()).getTime() - new Date(user.reviewCooldown).getTime() < 7200000) {
            throw new Error("Too many requests")
        }

        var { data, error } = await supabase
            .from('records')
            .select('*, levels!inner(*)')
            .neq('userid', user.uid!)
            .eq('needMod', false)
            .eq('isChecked', false)
            .eq('reviewer', user.uid!)
            .limit(1)
            .single()

        if (data) {
            return data
        }

        var { data, error } = await supabase
            .from('records')
            .select('*, levels!inner(*)')
            .lte('levels.rating', user.rating! + 500)
            .neq('userid', user.uid!)
            .eq('needMod', false)
            .eq('isChecked', false)
            .eq("levels.isPlatformer", false)
            .is('reviewer', null)
            .order('queueNo', { ascending: true, nullsFirst: false })
            .limit(1)
            .single()

        let res = data

        var { data, error } = await supabase
            .from('records')
            .select('*, levels!inner(*)')
            .neq('userid', user.uid!)
            .eq('needMod', false)
            .eq('isChecked', false)
            .eq("levels.isPlatformer", false)
            .is('reviewer', null)
            .order('queueNo', { ascending: true, nullsFirst: false })
            .limit(1)
            .single()

        if (res === null) {
            res = data
        } else if (data !== null && (new Date(res.queueNo!)) > (new Date(data.queueNo!))) {
            res = data
        }

        if (res === null) {
            throw new Error("No available record")
        }

        const record = new Record({ userid: res.userid, levelid: res.levelid })
        await record.pull()
        record.reviewer = res.reviewer = user.uid!
        record.queueNo = null
        record.update()

        return data
    }

    async getRecords({ start = 0, end = 50, isChecked = false } = {}) {
        let isCheckedBool = isChecked

        if (typeof isChecked === 'string') {
            isCheckedBool = (isChecked === 'true')
        }

        const { data, error } = await supabase
            .from('records')
            .select('*, players!userid!inner(*, clans!id(*)), reviewer:players!reviewer(*), levels(*)')
            .match({ isChecked: isCheckedBool })
            .eq('players.isHidden', false)
            .order('needMod', { ascending: false })
            .order('queueNo', { ascending: true, nullsFirst: false })
            .order('timestamp', { ascending: true })
            .range(start, end)

        if (error) {
            throw error
        }

        return data
    }

    async getPlayerSubmissions(uid: string, { start = '0', end = '50', ascending = 'true' } = {}) {
        const { data, error } = await supabase
            .from('records')
            .select('*, levels(*)')
            .eq('userid', uid)
            .eq('isChecked', false)
            .order('timestamp', { ascending: ascending === 'true' })
            .range(parseInt(start), parseInt(end))

        if (error) {
            throw error
        }

        return data
    }

    async changeSuggestedRating(userId: string, levelId: number, rating: number, user: Player) {
        if (user.uid !== userId) {
            throw new Error("Unauthorized")
        }

        const { data, error } = await supabase
            .from('records')
            .update({ suggestedRating: rating })
            .eq('levelid', levelId)
            .eq('userid', userId)

        if (error) {
            throw error
        }

        return data
    }
}

export default new RecordService()

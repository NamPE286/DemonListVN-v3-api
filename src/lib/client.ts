import supabase from '@database/supabase'
import Record from '@src/lib/classes/Record'
import Level from '@src/lib/classes/Level'
import type { Notification } from '@lib/types/Notification'

export async function getDemonListLevels({ start = 0, end = 50, sortBy = 'dlTop', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .not('dlTop', 'is', null)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw error
    }

    const levels: Level[] = []

    for (const i of data) {
        levels.push(new Level(i))
    }

    return levels
}

export async function getFeaturedListLevels({ start = 0, end = 50, sortBy = 'flTop', ascending = true } = {}) {
    if (typeof ascending == 'string') {
        ascending = (ascending == 'true')
    }

    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .not('flTop', 'is', null)
        .order(sortBy, { ascending: ascending })
        .range(start, end)

    if (error) {
        throw error
    }

    const levels: Level[] = []

    for (const i of data) {
        levels.push(new Level(i))
    }

    return levels
}

export async function getLevelRecords(id: number, { start = 0, end = 50, isChecked = true } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('levelid', id)
        .order('dlPt', { ascending: false })
        .order('flPt', { ascending: false })
        .eq('isChecked', isChecked)
        .range(start, end)

    if (error) {
        throw error
    }

    const records: Record[] = []

    for (const i of data) {
        records.push(new Record(i))
    }

    return records
}

export async function getPlayerRecords(uid: string, { start = 0, end = 50, isChecked = true } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('userid', uid)
        .order('dlPt', { ascending: false })
        .order('flPt', { ascending: false })
        .eq('isChecked', isChecked)
        .range(start, end)

    if (error) {
        throw error
    }

    const records: Record[] = []

    for (const i of data) {
        records.push(new Record(i))
    }

    return records
}

export async function sendNotification(notification: Notification) {
    notification.timestamp = Date.now()

    var { data, error } = await supabase
        .from('notifications')
        .insert(notification)

    if (error) {
        throw error
    }
}

export async function getPlayerNotifications(uid: string) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('to', uid)

    if (error) {
        throw error
    }

    const res: Notification[] = []

    for (const i of data!) {
        res.push(i)
    }

    return res
}

export async function clearPlayerNotifications(uid: string) {
    var { error } = await supabase
        .from('notifications')
        .delete()
        .eq('to', uid)

    if (error) {
        throw error
    }
}

export async function getRecords({ start = 0, end = 0, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .match({ isChecked: isChecked })
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}

export async function getDemonListRecords({ start = 0, end = 0, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .match({ isChecked: isChecked })
        .not('dlPt', 'is', null)
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}

export async function getFeaturedListRecords({ start = 0, end = 0, isChecked = false } = {}) {
    if (typeof isChecked == 'string') {
        isChecked = (isChecked == 'true')
    }

    const { data, error } = await supabase
        .from('records')
        .select('*')
        .match({ isChecked: isChecked })
        .not('flPt', 'is', null)
        .order('timestamp', { ascending: true })
        .range(start, end)

    if (error) {
        throw error
    }

    return data
}


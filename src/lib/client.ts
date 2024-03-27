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

export async function getDemonListSubmissions({ start = 0, end = 50 }) {
    const { data, error } = await supabase
        .from('records')
        .select('*')
        .not('dlPt', 'is', null)
        .order('flPt', { ascending: false })
        .eq('isChecked', false)
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

export async function getFeaturedListSubmissions({ start = 0, end = 50 }) {
    const { data, error } = await supabase
        .from('records')
        .select('*')
        .not('flPt', 'is', null)
        .order('flPt', { ascending: false })
        .eq('isChecked', false)
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

    if(error) {
        throw error
    }
}

export async function getPlayerNotifications(uid: string) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('to', uid)

    if(error) {
        throw error
    }

    const res: Notification[] = []

    for(const i of data!) {
        res.push(i)
    }

    return res
}
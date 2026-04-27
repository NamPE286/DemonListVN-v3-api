import supabase from "@src/client/supabase";
import type { Json } from '@src/types/supabase'

function toChangelogSnapshot(value: any): Json {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return value as Json
    }

    const { creatorFts, nameFts, ...snapshot } = value
    return snapshot as Json
}

export async function addChangelog(id: number, oldData: any) {
    let { data } = await supabase
        .from('levels')
        .select('*')
        .eq('id', id)
        .limit(1)
        .single()

    if (!data) {
        throw new Error('Level not found')
    }

    const { error } = await supabase
        .from('changelogs')
        .insert({ levelID: id, old: toChangelogSnapshot(oldData), new: toChangelogSnapshot(data) })

    if (error) {
        throw new Error(error.message)
    }
}
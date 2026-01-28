import type { TablesInsert } from "@src/types/supabase"
import supabase from '@src/client/supabase'
import { getCommit, getRawFile, getRawFileByRawUrl } from "@src/services/github.service"

export async function syncWiki(commitId: string) {
    const res = await getCommit('Demon-List-VN/wiki', commitId)

    const wikiToDelete: string[] = []
    const wikiToUpsert: TablesInsert<"wiki">[] = []

    if (!res || !Array.isArray(res.files)) {
        return
    }

    for (const f of res.files) {
        const filename: string = f.filename

        if (!filename.startsWith('src/')) {
            continue
        }

        if (f.status === 'removed') {
            wikiToDelete.push(filename)
            continue
        }

        const content = await getRawFileByRawUrl(f.raw_url!)
        const parts = filename.split('/')
        const basename = parts[parts.length - 1] || filename
        const lines = (content || '')
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l.length > 0)
        const rawTitleLine = lines[0] ?? null
        const rawDescLine = lines[1] ?? null
        const titleFromFile = rawTitleLine ? rawTitleLine.replace(/^# \s*/i, '').trim() : basename.replace(/\.md$/i, '')
        const descriptionFromFile = rawDescLine || null

        wikiToUpsert.push({
            path: filename,
            title: titleFromFile,
            description: descriptionFromFile,
            created_at: new Date().toISOString()
        })
    }

    if (wikiToDelete.length > 0) {
        const { error } = await supabase
            .from('wiki')
            .delete()
            .in('path', wikiToDelete)
        if (error) {
            throw new Error(error.message)
        }
    }

    const { error } = await supabase
        .from('wiki')
        .upsert(wikiToUpsert)
        
    if (error) {
        throw new Error(error.message)
    }
}
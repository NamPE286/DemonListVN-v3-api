import type { TablesInsert } from "@src/types/supabase"
import supabase from "@src/client/supabase"
import { getCommit, getRawFileByRawUrl } from "@src/services/github.service"

export async function syncWiki(commitId: string) {
    const res = await getCommit("Demon-List-VN/wiki", commitId)
    if (!res?.files?.length) return

    const toDelete: string[] = []
    const toUpsert: TablesInsert<"wiki">[] = []

    for (const { filename, status, raw_url } of res.files) {
        if (!filename.startsWith("src/")) continue

        if (status === "removed") {
            toDelete.push(filename)
            continue
        }

        const content = await getRawFileByRawUrl(raw_url!)
        const parts = filename.split("/")
        const lines = (content ?? "").split(/\r?\n/)

        const title =
            lines.find(l => l.trim())?.replace(/^#\s*/i, "").trim() ??
            parts.at(-1)!.replace(/\.md$/i, "")

        const descLine = lines[1]
        const description = descLine == null ? null : descLine.trim()

        toUpsert.push({
            path: parts.slice(2).join("/"),
            locale: parts[1],
            title,
            description,
            created_at: new Date().toISOString()
        })
    }

    if (toDelete.length) {
        const { error } = await supabase.from("wiki").delete().in("path", toDelete)
        if (error) throw error
    }

    const { error } = await supabase.from("wiki").upsert(toUpsert)
    if (error) throw error
}

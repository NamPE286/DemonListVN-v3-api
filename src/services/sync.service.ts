import type { TablesInsert } from "@src/types/supabase"
import supabase from "@src/client/supabase"
import { getCommit, getRawFileByRawUrl } from "@src/services/github.service"

function getPathAndLocale(filename: string) {
    const parts = filename.split("/")

    return {
        path: parts.slice(2).join("/"),
        locale: parts[1]
    }
}

export async function syncWiki(commitId: string) {
    const res = await getCommit("Demon-List-VN/wiki", commitId)

    if (!res?.files?.length) {
        return
    }

    const toDelete: string[] = []
    const toUpsert: TablesInsert<"wiki">[] = []

    for (const { filename, status, raw_url, previous_filename } of res.files) {
        if (!filename.startsWith("src/")) {
            continue
        }

        if (status === "removed") {
            toDelete.push(getPathAndLocale(filename).path)
            continue
        }

        if (status == 'renamed') {
            toDelete.push(getPathAndLocale(previous_filename!).path)
        }

        const { path, locale } = getPathAndLocale(filename)
        const content = await getRawFileByRawUrl(raw_url!)
        const lines = (content ?? "").split(/\r?\n/)
        const title = lines.find(l => l.trim())?.replace(/^#\s*/i, "").trim()!

        let description: string | null = null
        let foundTitle = false
        const imageRegex = /!\[.*?\]\((.*?)\)/

        for (const line of lines) {
            const trimmedLine = line.trim()
            if (trimmedLine) {
                if (!foundTitle) {
                    foundTitle = true
                    continue
                }
                
                // Skip image lines
                if (!imageRegex.test(trimmedLine)) {
                    description = trimmedLine
                    break
                }
            }
        }

        let image: string | null = null

        for (const line of lines) {
            const match = line.match(imageRegex)
            if (match) {
                image = match[1]
                break
            }
        }

        toUpsert.push({
            path,
            locale,
            title,
            description,
            modifiedAt: new Date().toISOString(),
            image: image ?? null
        })
    }

    if (toDelete.length) {
        const { error } = await supabase
            .from("wiki")
            .delete()
            .in("path", toDelete)

        if (error) {
            throw error
        }
    }

    const { error } = await supabase
        .from("wiki")
        .upsert(toUpsert)

    if (error) {
        throw error
    }
}

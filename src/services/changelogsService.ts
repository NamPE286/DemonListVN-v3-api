import supabase from '@src/database/supabase'
import logger from '@src/utils/logger'

interface Changelog {
    newLevels: {
        dl: string[],
        fl: string[]
    },
    changes: {
        dl: string[],
        fl: string[]
    }
}

export class ChangelogsService {
    async publishChangelogs() {
        const { data, error } = await supabase
            .from('changelogs')
            .select('*, levelID(*)')
            .eq('published', false)
            .order('created_at', { ascending: true })

        if (error) {
            throw error
        }

        const changelog: Changelog = {
            newLevels: {
                dl: [],
                fl: []
            },
            changes: {
                dl: [],
                fl: []
            }
        }

        for (const i of data) {
            const oldData: any = i.old
            const newData: any = i.levelID

            if (oldData == null) {
                if (newData.rating) {
                    changelog.newLevels.dl.push(`${newData.name} by ${newData.creator} \`${newData.rating}rt (#${newData.dlTop})\``)
                }

                if (newData.flTop) {
                    changelog.newLevels.fl.push(`${newData.name} by ${newData.creator} \`#${newData.flTop} (${newData.flPt}pt)\``)
                }
            } else {
                if (oldData.rating != newData.rating) {
                    changelog.changes.dl.push(`${newData.name} by ${newData.creator} \`${oldData.rating}rt -> ${newData.rating}rt (#${oldData.dlTop} -> #${newData.dlTop})\``)
                }

                if (oldData.flTop != newData.flTop) {
                    changelog.changes.fl.push(`${newData.name} by ${newData.creator} \`#${oldData.flTop} -> #${newData.flTop} (${oldData.flPt}pt -> ${newData.flPt}pt)\``)
                }
            }
        }

        // Format result
        let result = ''

        if (!(!changelog.newLevels.dl.length && !changelog.newLevels.fl.length)) {
            result += `\n## __New Levels__`
        }

        if (changelog.newLevels.dl.length) {
            result += `\n- **Demon List**\n`

            for (const i of changelog.newLevels.dl) {
                result += ' - ' + i + '\n'
            }

            result = result.slice(0, -1)
        }

        if (changelog.newLevels.fl.length) {
            result += `\n- **Featured List**\n`

            for (const i of changelog.newLevels.fl) {
                result += ' - ' + i + '\n'
            }

            result = result.slice(0, -1)
        }

        if (!(!changelog.changes.dl.length && !changelog.changes.fl.length)) {
            result += `\n## __Changes__`
        }

        if (changelog.changes.dl.length) {
            result += `\n- **Demon List**\n`

            for (const i of changelog.changes.dl) {
                result += ' - ' + i + '\n'
            }

            result = result.slice(0, -1)
        }

        if (changelog.changes.fl.length) {
            result += `\n- **Featured List**\n`

            for (const i of changelog.changes.fl) {
                result += ' - ' + i + '\n'
            }

            result = result.slice(0, -1)
        }

        // Mark as published
        await supabase
            .from('changelogs')
            .update({ published: true })
            .eq('published', false)

        logger.changelog(result)
    }
}

export default new ChangelogsService()

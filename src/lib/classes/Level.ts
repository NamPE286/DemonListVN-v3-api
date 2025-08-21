import supabase from '@database/supabase'
import { SearchLevelsType, type LevelsData } from '@sodiumlabs/gdapi'
import { gdapi } from '@src/lib/classes/GDApi'
import { addChangelog } from '@src/lib/client/changelog'
import type { TLevel } from '@src/lib/types'

type APILevel = LevelsData['levels'][0] & {
    author: string,
    difficulty: string
}

interface Level extends TLevel { }

class Level {
    constructor(data: TLevel) {
        Object.assign(this, data)
    }

    async pull() {
        const { data, error } = await supabase
            .from('levels')
            .select('*')
            .eq('id', this.id!)
            .single()

        if (error) {
            throw error
        }

        Object.assign(this, data)
    }

    async fetchFromGD(): Promise<APILevel> {
        try {
            const data = await gdapi.searchLevels({
                type: SearchLevelsType.Query,
                query: String(this.id)
            })

            const level: APILevel = (data.levels[0] as any);
            level.author = data.creators[0].username;

            if (level.demon) {
                const diffStr = ['Hard', '', '', 'Easy', 'Medium', 'Insane', 'Extreme']
                level.difficulty = diffStr[level.demonDifficulty] + ' Demon'
            } else {
                const mp = {
                    0: 'Unrated',
                    10: 'Easy',
                    20: 'Normal',
                    30: 'Hard',
                    40: 'Harder',
                    50: 'Insane'
                }

                // @ts-ignore
                level.difficulty = mp[level.difficultyNumerator]
            }

            return level;
        } catch (err) {
            console.error(err)
            console.warn('Fallback to GDBrowser')

            const res: any = await (await fetch(`https://gdbrowser.com/api/level/${this.id}`)).json()
            const lenMp = {
                'Tiny': 0,
                'Short': 1,
                'Medium': 2,
                'Long': 3,
                'XL': 4,
                'Plat': 5
            }

            // @ts-ignore
            res.length = lenMp[res.length]
            
            return res;
        }
    }

    async update() {
        let { data } = await supabase
            .from('levels')
            .select('*')
            .eq('id', this.id!)
            .limit(1)
            .single()

        let { error } = await supabase
            .from('levels')
            .upsert(this as any)

        await supabase.rpc('updateList')

        if (error) {
            throw error
        }

        addChangelog(this.id!, data)
    }

    async delete() {
        const { error } = await supabase
            .from('levels')
            .delete()
            .eq('id', this.id!)

        if (error) {
            throw error
        }
    }
}

export default Level
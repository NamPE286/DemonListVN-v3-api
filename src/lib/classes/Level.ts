import supabase from '@database/supabase'
import { SearchLevelsType } from '@sodiumlabs/gdapi'
import { gdapi } from '@src/lib/classes/GDApi'
import { addChangelog } from '@src/lib/client/changelog'
import type { TLevel } from '@src/lib/types'

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

    async fetchFromGD() {
        const data = await gdapi.searchLevels({
            type: SearchLevelsType.Query,
            query: String(this.id)
        })

        type APILevel = typeof data.levels[0] & {
            author: string,
            difficulty: string
        }

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
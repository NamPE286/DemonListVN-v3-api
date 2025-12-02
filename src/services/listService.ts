import { getDemonListLevels, getFeaturedListLevels, getPlatformerListLevels } from '@lib/client/level'
import { getDemonListRecords, getFeaturedListRecords } from '@src/lib/client/record'
import supabase from '@src/database/supabase'

export class ListService {
    async getDemonList(query: any) {
        return await getDemonListLevels(query)
    }

    async getPlatformerList(query: any) {
        return await getPlatformerListLevels(query)
    }

    async getFeaturedList(query: any) {
        return await getFeaturedListLevels(query)
    }

    async getDemonListRecords(query: any) {
        return await getDemonListRecords(query)
    }

    async getFeaturedListRecords(query: any) {
        return await getFeaturedListRecords(query)
    }

    async getRandomLevel(list: string, exclude?: string) {
        const maxID = await this.getIDBound(list, false)
        const minID = await this.getIDBound(list, true) - 1000000
        const random = Math.floor(Math.random() * (maxID - minID + 1)) + minID

        const { data, error } = await supabase
            .from('levels')
            .select('*')
            .not(list == 'fl' ? 'flTop' : 'dlTop', 'is', null)
            .eq('isPlatformer', list == 'pl')
            .not('id', 'in', exclude ? exclude : '()')
            .order('id', { ascending: true })
            .gte('id', random)
            .limit(1)
            .single()

        if (error) {
            throw error
        }

        return data
    }

    private async getIDBound(list: string, min: boolean) {
        const { data, error } = await supabase
            .from('levels')
            .select('id')
            .order('id', { ascending: min })
            .not(list == 'fl' ? 'flTop' : 'dlTop', 'is', null)
            .eq('isPlatformer', list == 'pl')
            .limit(1)
            .single()

        if (error) {
            throw error
        }

        return data.id
    }
}

export default new ListService()

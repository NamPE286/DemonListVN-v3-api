import levelsService from '@src/services/levelsService'
import recordService from '@src/services/recordService'
import supabase from '@src/database/supabase'

export class ListService {
    async getDemonList(query: any) {
        return await levelsService.getDemonListLevels(query)
    }

    async getPlatformerList(query: any) {
        return await levelsService.getPlatformerListLevels(query)
    }

    async getFeaturedList(query: any) {
        return await levelsService.getFeaturedListLevels(query)
    }

    async getDemonListRecords(query: any) {
        return await recordService.getDemonListRecords(query)
    }

    async getFeaturedListRecords(query: any) {
        return await recordService.getFeaturedListRecords(query)
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

import supabase from '@src/database/supabase'

export class ItemService {
    private async getCase(id: number) {
        const { data, error } = await supabase
            .from('caseItems')
            .select('*, items!caseItems_itemId_fkey(*)')
            .eq('caseId', id)

        if (error) {
            throw error
        }

        return data
    }

    private async getItem(id: number) {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            throw error
        }

        return data
    }

    async getItemById(id: number) {
        const item = await this.getItem(id)

        if (item.type === 'case') {
            const caseItems = await this.getCase(id)

            return { ...item, caseItems }
        }

        return item
    }
}

export default new ItemService()

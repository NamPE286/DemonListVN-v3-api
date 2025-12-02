import supabase from '@src/database/supabase'

export class RefreshService {
    async refreshRanks() {
        const a = await supabase.rpc('update_rank')

        if (a.error) {
            throw a.error
        }

        const b = await supabase.rpc('update_list')

        if (b.error) {
            throw b.error
        }
    }
}

export default new RefreshService()

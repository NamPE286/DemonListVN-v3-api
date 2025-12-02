import supabase from '@src/database/supabase'

export class MergeAccountService {
    async mergeAccounts(uidA: string, uidB: string) {
        // Transfer all records from player A to player B
        const { data, error } = await supabase
            .from('records')
            .update({ userid: uidB })
            .eq('userid', uidA)

        if (error) {
            throw error
        }

        // Delete player A
        const deleteResult = await supabase
            .from('players')
            .delete()
            .match({ uid: uidA })

        if (deleteResult.error) {
            throw deleteResult.error
        }

        // Update ranks
        await supabase.rpc('update_rank')
    }
}

export default new MergeAccountService()

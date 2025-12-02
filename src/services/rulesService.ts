import supabase from '@src/database/supabase'

export class RulesService {
    async getRules() {
        const { data, error } = await supabase
            .from('rules')
            .select('*')

        if (error) {
            throw error
        }

        return data
    }
}

export default new RulesService()

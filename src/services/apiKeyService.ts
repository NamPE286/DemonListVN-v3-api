import supabase from '@src/database/supabase'

export class APIKeyService {
    async getAllAPIKeys(uid: string) {
        const { data, error } = await supabase
            .from('APIKey')
            .select('*')
            .eq('uid', uid)

        if (error) {
            throw error
        }

        return data
    }

    async createAPIKey(uid: string) {
        const { data, error } = await supabase
            .from('APIKey')
            .insert({ uid: uid })

        if (error) {
            throw error
        }
    }

    async deleteAPIKey(uid: string, key: string) {
        const { error } = await supabase
            .from('APIKey')
            .delete()
            .match({ uid: uid, key: key })

        if (error) {
            throw error
        }
    }
}

export default new APIKeyService()

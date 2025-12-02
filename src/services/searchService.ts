import supabase from "@src/database/supabase"

export class SearchService {
    // Moved from lib/client/search.ts
    private isNumeric(value: string) {
        return /^-?\d+$/.test(value)
    }

    private async getPlayerByDiscordID(id: string) {
        const { data, error } = await supabase
            .from("players")
            .select("*")
            .eq("discord", id)

        if (error) {
            throw error
        }

        return data
    }

    async searchLevels(query: string, { limit = 5 } = {}) {
        if (query.startsWith("discord:")) {
            return []
        }

        if (this.isNumeric(query)) {
            const { data, error } = await supabase
                .from('levels')
                .select('*')
                .eq('id', Number(query))
                .limit(limit)

            if (error) {
                throw error
            }

            return data
        }

        const { data, error } = await supabase
            .from('levels')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(limit)

        if (error) {
            throw error
        }

        return data
    }

    async searchPlayers(query: string, { limit = 5 } = {}) {
        if (query.startsWith("discord:")) {
            const id = query.split(":")[1]

            return await this.getPlayerByDiscordID(id)
        }

        const { data, error } = await supabase
            .from('players')
            .select('*')
            .ilike('name', `%${query}%`)
            .eq('isHidden', false)
            .limit(limit)

        if (error) {
            throw error
        }

        return data
    }

    async search(query: string, options: any) {
        return {
            levels: await this.searchLevels(query, options),
            players: await this.searchPlayers(query, options)
        }
    }
}

export default new SearchService()

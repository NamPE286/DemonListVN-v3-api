import supabase from "@src/database/supabase";

function isNumeric(value: string) {
    return /^-?\d+$/.test(value);
}

async function getPlayerByDiscordID(id: string) {
    const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("discord", id)

    if (error) {
        throw error
    }

    return data;
}

export const search = {
    async levels(query: string, { limit = 5 } = {}) {
        if (query.startsWith("discord:")) {
            return [];
        }

        if (isNumeric(query)) {
            const { data, error } = await supabase
                .from('levels')
                .select('*')
                .eq('id', Number(query))
                .limit(limit)

            if (error) {
                throw error
            }

            return data;
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
    },

    async players(query: string, { limit = 5 } = {}) {
        if (query.startsWith("discord:")) {
            const id = query.split(":")[1];

            return await getPlayerByDiscordID(id);
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
}
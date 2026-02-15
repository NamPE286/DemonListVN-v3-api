import supabase from "@src/client/supabase";

function isNumeric(value: string) {
    return /^-?\d+$/.test(value);
}

async function searchPlayersByName(query: string, includeHidden = false, limit = 5) {
    let request = supabase
        .from('players')
        .select('*')
        .ilike('name', `%${query}%`)

    if (!includeHidden) {
        request = request.eq('isHidden', false)
    }

    const { data, error } = await request.limit(limit)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

async function getPlayerByDiscordIDWithVisibility(id: string, includeHidden = false) {
    let request = supabase
        .from('players')
        .select('*, clans!id(*)')
        .eq('discord', id)

    if (!includeHidden) {
        request = request.eq('isHidden', false)
    }

    const { data, error } = await request

    if (error) {
        throw new Error(error.message)
    }

    return data
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
                throw new Error(error.message)
            }

            return data;
        }

        const { data, error } = await supabase
            .from('levels')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(limit)

        if (error) {
            throw new Error(error.message)
        }

        return data
    },

    async players(query: string, { limit = 5, includeHidden = false } = {}) {
        if (query.startsWith("discord:")) {
            const id = query.split(":")[1];

            return await getPlayerByDiscordIDWithVisibility(id, includeHidden);
        }

        return await searchPlayersByName(query, includeHidden, limit)
    }
}
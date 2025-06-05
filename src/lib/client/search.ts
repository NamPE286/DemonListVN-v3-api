import supabase from "@src/database/supabase";
import Level from "@src/lib/classes/Level";
import Player from "@src/lib/classes/Player";

function isNumeric(value: string) {
    return /^-?\d+$/.test(value);
}

export const search = {
    async levels(query: string, { limit = 5} = {}) {
        if (isNumeric(query)) {
            const { data, error } = await supabase
                .from('levels')
                .select('*')
                .eq('id', query)
                .limit(limit)

            if (error) {
                throw error
            }

            const res: Level[] = []

            for (const i of data) {
                res.push(new Level(i));
            }

            return res
        }

        const { data, error } = await supabase
            .from('levels')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(limit)

        if (error) {
            throw error
        }

        const res: Level[] = []

        for (const i of data) {
            res.push(new Level(i));
        }

        return res
    },

    async players(query: string, { limit = 5} = {}) {
        const { data, error } = await supabase
            .from('players')
            .select('name, uid, isHidden, supporterUntil, isAvatarGif, clans!id(*)')
            .ilike('name', `%${query}%`)
            .eq('isHidden', false)
            .limit(limit)

        if (error) {
            throw error
        }

        const res: Player[] = []

        for (const i of data) {
            res.push(new Player(i));
        }

        return res
    }
}
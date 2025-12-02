import supabase from "@src/database/supabase"

export class LevelsService {
    async getNewLevels() {
        const { data, error } = await supabase
            .from("levels")
            .select("*")
            .is("rating", null)
            .is("flTop", null)
            .is("insaneTier", null)
            .is("isNonList", false)

        if (error) {
            throw error
        }

        return data
    }

    async getRandomLevels(limit: number, filterType: string | null) {
        const { data, error } = await supabase.rpc("get_random_levels", {
            row_count: limit,
            filter_type: filterType,
        })

        if (error) {
            throw error
        }

        return data
    }
}

export default new LevelsService()

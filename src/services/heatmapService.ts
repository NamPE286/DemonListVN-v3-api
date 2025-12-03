import supabase from "@src/database/supabase";

export class HeatmapService {
    private async fetchData(uid: string, year: number): Promise<any> {
        let { data, error } = await supabase
            .from('heatmap')
            .select('*')
            .eq('uid', uid)
            .eq('year', year)
            .limit(1)
            .single()

        if (data == null) {
            return { uid: uid, year: year, days: Array(366).fill(0) }
        }

        return data
    }

    private dayOfYear(year: number, month: number, date: number) {
        let x = new Date(year, 0, 1).getTime();
        let y = new Date(year, month, date).getTime();

        return Math.floor((y - x) / 86400000);
    }

    async getHeatmap(uid: string, year: number) {
        return await this.fetchData(uid, year)
    }

    async updateHeatmap(uid: string, count: number) {
        const date = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}))
        const data = await this.fetchData(uid, date.getFullYear())
        const year = date.getFullYear()
        const month = date.getMonth()
        const day = date.getDate()

        data.days[this.dayOfYear(year, month, day)] += count

        const { error } = await supabase
            .from('heatmap')
            .upsert(data)

        if (error) {
            throw error
        }
    }
}

export default new HeatmapService()

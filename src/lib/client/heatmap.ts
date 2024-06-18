import supabase from "@src/database/supabase";

async function fetchData(uid: string, year: number): Promise<any> {
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

function dayOfYear(year: number, month: number, date: number) {
    let x = new Date(year, 0, 1).getTime();
    let y = new Date(year, month, date).getTime();

    return Math.floor((y - x) / 86400000);
}

export async function getHeatmap(uid: string, year: number) {
    return await fetchData(uid, year)
}

export async function updateHeatmap(uid: string, count: number) {
    const date = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}))
    const data = await fetchData(uid, date.getFullYear())
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()

    data.days[dayOfYear(year, month, day)] += count

    const { error } = await supabase
        .from('heatmap')
        .upsert(data)

    if (error) {
        throw error
    }
}
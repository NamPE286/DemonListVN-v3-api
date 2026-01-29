import supabase from "@src/client/supabase";

export async function getWikis(prefix: string, locales: string[] | undefined = undefined) {
    let query = supabase
        .from('wiki')
        .select('*')
        .like('path', prefix)

    if (locales && locales.length) {
        query = query.in('locale', locales)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return data.map(i => {
        return {
            ...i,
            rawUrl: `https://raw.githubusercontent.com/Demon-List-VN/wiki/refs/heads/main/src/${i.locale}/${i.path}`
        };
    });
}
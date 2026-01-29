import supabase from "@src/client/supabase";

export async function getWikis(path: string, locales: string[] | undefined = undefined) {
    let query = supabase
        .from('wiki')
        .select('*')

    if (path.endsWith(".md")) {
        query = query.eq('path', path)
    } else {
        query = query.eq('path', path + "/index.md")
    }

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
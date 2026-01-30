import supabase from "@src/client/supabase";
import type { Tables } from "@src/types/supabase";

interface Filter {
    sortBy: string
    ascending: boolean
    offset: number
    limit: number
}

async function getWikiMetadatas(paths: string[], locales: string[] | undefined = undefined) {
    let query = supabase
        .from('wiki')
        .select('*')
        .in('path', paths)

    if (locales && locales.length) {
        query = query.in('locale', locales)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    const result: Record<string, Record<string, Tables<'wiki'> & { rawUrl: string }>> = {};

    for (const item of data) {
        const metadata = {
            ...item,
            rawUrl: `https://raw.githubusercontent.com/Demon-List-VN/wiki/refs/heads/main/src/${item.locale}/${item.path}`
        };

        result[item.path] = {}
        result[item.path][item.locale] = metadata;
    }

    return result;
}

export async function getWikis(
    path: string,
    locales: string[] | undefined = undefined,
    filter: Filter = {
        sortBy: 'created_at',
        ascending: false,
        offset: 0,
        limit: 10
    }) {
    const { data: treeItem, error } = await supabase
        .from('wikiTree')
        .select('*')
        .eq('path', path)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    if (treeItem.type == 'file') {
        return {
            ...treeItem,
            metadata: await getWikiMetadatas([treeItem.path!], locales)
        }
    }

    if (treeItem.type == 'folder') {
        const { data, error } = await supabase
            .from('wikiTree')
            .select('*')
            .eq('parent', treeItem.path!)
            .order('type', { ascending: false })
            .order(filter.sortBy, { ascending: filter.ascending })
            .range(filter.offset, filter.offset + filter.limit - 1)

        if (error) {
            throw new Error(error.message)
        }

        const filePaths = data.filter((x) => x.type == 'file').map((x) => x.path!)
        const metadatas = await getWikiMetadatas(filePaths, locales)

        return {
            ...treeItem,
            items: data.map((x) => {
                if (x.type == 'file') {
                    if (!metadatas[x.path!]) {
                        return null;
                    }

                    return { ...x, metadata: metadatas[x.path!] };
                }

                return x;
            }).filter(x => x !== null)
        }
    }

    throw new Error("File type is not supported")
}
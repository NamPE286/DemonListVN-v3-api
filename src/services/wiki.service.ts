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

    const result: Record<string, Tables<'wiki'> & { rawUrl: string }> = {};

    for (const item of data) {
        const metadata = {
            ...item,
            rawUrl: `https://raw.githubusercontent.com/Demon-List-VN/wiki/refs/heads/main/src/${item.locale}/${item.path}`
        };

        result[item.locale] = metadata;
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
            .like('path', `${path}/%`)
            .eq('parent', treeItem.path!)
            .order('type', { ascending: false })
            .order(filter.sortBy, { ascending: filter.ascending })
            .range(filter.offset, filter.offset + filter.limit)

        if (error) {
            throw new Error(error.message)
        }

        const filePaths = data.filter((x) => x.type == 'file').map((x) => x.path!)
        const metadatasGroupedByLocale = await getWikiMetadatas(filePaths, locales)
        const metadatas = new Map<string, Record<string, Tables<'wiki'> & { rawUrl: string }>>()

        for (const [locale, item] of Object.entries(metadatasGroupedByLocale)) {
            if (!metadatas.has(item.path)) {
                metadatas.set(item.path, {})
            }

            const pathMetadatas = metadatas.get(item.path)!

            pathMetadatas[locale] = item
        }

        return {
            ...treeItem,
            items: data.map((x) => {
                if (x.type == 'file') {
                    if (!metadatas.has(x.path!)) {
                        return null;
                    }

                    return { ...x, metadata: metadatas.get(x.path!) };
                }

                return x;
            }).filter(x => x !== null)
        }
    }

    throw new Error("File type is not supported")
}
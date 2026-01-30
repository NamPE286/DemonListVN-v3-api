import supabase from "@src/client/supabase";

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

    const result: Record<string, any[]> = {};
    
    for (const item of data) {
        const metadata = {
            ...item,
            rawUrl: `https://raw.githubusercontent.com/Demon-List-VN/wiki/refs/heads/main/src/${item.locale}/${item.path}`
        };
        
        if (!result[item.locale]) {
            result[item.locale] = [];
        }
        
        result[item.locale].push(metadata);
    }
    
    return result;
}

export async function getWikis(path: string, locales: string[] | undefined = undefined) {
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
            .eq('level', treeItem.level! + 1)

        if (error) {
            throw new Error(error.message)
        }

        const filePaths = data.filter((x) => x.type == 'file').map((x) => x.path!)
        const metadatasGroupedByLocale = await getWikiMetadatas(filePaths, locales)
        const metadatas = new Map<string, Record<string, any[]>>()

        for (const [locale, items] of Object.entries(metadatasGroupedByLocale)) {
            for (const item of items) {
                if (!metadatas.has(item.path)) {
                    metadatas.set(item.path, {})
                }

                const pathMetadatas = metadatas.get(item.path)!
                if (!pathMetadatas[locale]) {
                    pathMetadatas[locale] = []
                }
                pathMetadatas[locale].push(item)
            }
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

    throw new Error("Not supported file type")
}
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

    return data.map(i => {
        return {
            ...i,
            rawUrl: `https://raw.githubusercontent.com/Demon-List-VN/wiki/refs/heads/main/src/${i.locale}/${i.path}`
        };
    });
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
            type: 'file',
            metadatas: await getWikiMetadatas([treeItem.path!], locales)
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
        const metadatasArray = await getWikiMetadatas(filePaths, locales)
        const metadatas = new Map<string, typeof metadatasArray>()

        for (const i of metadatasArray) {
            if (!metadatas.has(i.path)) {
                metadatas.set(i.path, [])
            }

            metadatas.get(i.path)?.push(i)
        }

        return {
            type: 'folder',
            items: data.map((x) => {
                if (x.type == 'file') {
                    return { ...x, metadatas: metadatas.get(x.path!) };
                }

                return x;
            })
        }
    }

    throw new Error("Not supported file type")
}
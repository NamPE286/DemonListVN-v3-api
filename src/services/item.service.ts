import supabase from "@src/client/supabase";
import { mergeUniqueById, normalizeFullTextSearchQuery } from '@src/utils/full-text-search'

export async function getCase(id: number) {
    const { data, error } = await supabase
        .from('caseItems')
        .select('*, items!caseItems_itemId_fkey(*)')
        .eq('caseId', id)

    if (error) {
        throw new Error(error.message)
    }

    return data;
}

export async function getItem(id: number) {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data;
}

export async function searchItems(query: string) {
    const normalizedQuery = normalizeFullTextSearchQuery(query)

    if (!normalizedQuery.length) {
        return []
    }

    const isNumeric = !isNaN(Number(normalizedQuery))

    if (isNumeric) {
        const [{ data: idData, error: idError }, { data: nameData, error: nameError }] = await Promise.all([
            supabase
                .from('items')
                .select('*')
                .eq('id', Number(normalizedQuery))
                .limit(50),
            supabase
                .from('items')
                .select('*')
                .textSearch('nameFts', normalizedQuery, { type: 'websearch' })
                .order('id', { ascending: true })
                .limit(50)
        ])

        if (idError) {
            throw new Error(idError.message)
        }

        if (nameError) {
            throw new Error(nameError.message)
        }

        return mergeUniqueById(idData, nameData)
            .sort((left, right) => left.id - right.id)
            .slice(0, 50)
    }

    const { data, error } = await supabase
        .from('items')
        .select('*')
        .textSearch('nameFts', normalizedQuery, { type: 'websearch' })
        .order('id', { ascending: true })
        .limit(50)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

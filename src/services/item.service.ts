import supabase from "@src/client/supabase";
import { buildFullTextSearchParams, mergeUniqueById } from '@src/utils/full-text-search'

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

export async function searchItems(query: string, searchType?: string) {
    const searchParams = buildFullTextSearchParams(query, searchType)

    if (!searchParams) {
        return []
    }

    const isNumeric = !isNaN(Number(query))

    if (isNumeric) {
        const [{ data: idData, error: idError }, { data: nameData, error: nameError }] = await Promise.all([
            supabase
                .from('items')
                .select('*')
                .eq('id', Number(query))
                .limit(50),
            supabase
                .from('items')
                .select('*')
                .textSearch('nameFts', searchParams.query, searchParams.options)
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
        .textSearch('nameFts', searchParams.query, searchParams.options)
        .order('id', { ascending: true })
        .limit(50)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

import supabase from "@src/database/supabase";
import { getCase as getCaseItems } from "@src/lib/client/item";

export async function getInventoryItem(inventoryItemId: number) {
    const { data, error } = await supabase
        .from('inventory')
        .select('*, items(*)')
        .eq('id', inventoryItemId)
        .eq('consumed', false)
        .single()

    if (error) {
        throw error
    }

    return data;
}

export async function consumeCase(itemId: number) {
    const caseItems = await getCaseItems(itemId)

    return caseItems
}
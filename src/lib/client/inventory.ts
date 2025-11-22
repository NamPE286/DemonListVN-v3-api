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

export async function consumeCase(inventoryItemId: number, itemId: number) {
    const { error } = await supabase
        .from('inventory')
        .update({ consumed: true })
        .eq('id', inventoryItemId)

    if (error) {
        throw error
    }

    const caseItems = await getCaseItems(itemId)
    const roll = Math.random();

    let x = 0;

    for (const i of caseItems) {
        x += i.rate!;

        if (x >= roll) {
            return i;
        }
    }

    return null;
}
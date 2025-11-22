import supabase from "@src/database/supabase";
import type Player from "@src/lib/classes/Player";
import { getCase as getCaseItems } from "@src/lib/client/item";

export async function getInventoryItem(inventoryItemId: number) {
    const { data, error } = await supabase
        .from('inventory')
        .select('*, items(*)')
        .eq('id', inventoryItemId)
        .eq('consumed', false)
        .or(`expireAt.is.null,expireAt.gt.${new Date().toISOString()}`)
        .single()

    if (error) {
        throw error
    }

    return data;
}

export async function consumeCase(player: Player, inventoryItemId: number, itemId: number) {
    const caseItems = await getCaseItems(itemId)
    const roll = Math.random();

    let x = 0;

    for (const i of caseItems) {
        x += i.rate!;

        if (x >= roll) {
            await addInventoryItem(player, i);
            await addCaseResult(player, inventoryItemId, i)
            return i;
        }
    }

    await addCaseResult(player, inventoryItemId, null)
    return {};
}

export async function addCaseResult(player: Player, inventoryItemId: number, caseItem: CaseItem | null) {
    console.log(inventoryItemId)

    var { error } = await supabase
        .from('inventory')
        .update({ consumed: true })
        .eq('id', inventoryItemId)

    if (error) {
        throw error
    }

    var { error } = await supabase
        .from('caseResult')
        .insert({
            openerId: player.uid!,
            resultId: caseItem ? caseItem.id : null,
            caseId: caseItem?.caseId!
        })

    if (error) {
        throw error
    }
}

type CaseItem = Awaited<ReturnType<typeof getCaseItems>> extends Array<infer T> ? T : never;

export async function addInventoryItem(player: Player, caseItem: CaseItem) {
    if (!player.uid) {
        throw new Error('player.uid is undefined');
    }

    if (caseItem.items?.productId) {
        if (!caseItem.expireAfter) {
            throw new Error("expireAfter is null")
        }

        var { data, error } = await supabase
            .from('coupons')
            .insert({
                percent: 1,
                validUntil: new Date(new Date().getTime() + caseItem.expireAfter).toISOString(),
                productID: caseItem.items?.productId,
                owner: player.uid
            })
            .select()
            .single()


        if (!data || error) {
            throw error
        }
    } else {
        var { error } = await supabase
            .from('inventory')
            .insert({
                userID: player.uid,
                itemId: caseItem.id,
                consumed: false
            })

        if (error) {
            throw error
        }
    }
}
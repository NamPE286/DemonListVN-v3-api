import supabase from "@src/client/supabase";
import { getEventQuest } from "@src/services/event-quest.service";
import { getCase as getCaseItems, getItem } from "@src/services/item.service";
import type { getPlayer } from "@src/services/player.service";
import type { TablesInsert } from "@src/types/supabase";

type Player = Awaited<ReturnType<typeof getPlayer>>;

export async function getInventoryItem(inventoryItemId: number) {
    const { data, error } = await supabase
        .from('inventory')
        .select('*, items(*)')
        .eq('id', inventoryItemId)
        .eq('consumed', false)
        .or(`expireAt.is.null,expireAt.gt.${new Date().toISOString()}`)
        .single()

    if (error) {
        throw new Error(error.message)
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
            await addInventoryCaseItem(player, i);
            await addCaseResult(player, inventoryItemId, i)
            return i;
        }
    }

    await addCaseResult(player, inventoryItemId, null)
    return {};
}

export async function addCaseResult(player: Player, inventoryItemId: number, caseItem: CaseItem | null) {
    var { error } = await supabase
        .from('inventory')
        .update({ consumed: true })
        .eq('id', inventoryItemId)

    if (error) {
        throw new Error(error.message)
    }

    var { error } = await supabase
        .from('caseResult')
        .insert({
            openerId: player.uid!,
            resultId: caseItem ? caseItem.id : null,
            caseId: caseItem?.caseId!
        })

    if (error) {
        throw new Error(error.message)
    }
}

export async function addInventoryItem(insertData: TablesInsert<"inventory">) {
    const item = await getItem(insertData.itemId)

    if (item.stackable) {
        const { data: existingItem } = await supabase
            .from('inventory')
            .select('id, quantity')
            .eq('userID', insertData.userID)
            .eq('itemId', insertData.itemId)
            .eq('consumed', false)
            .maybeSingle()

        if (existingItem) {
            const newQuantity = existingItem.quantity + (insertData.quantity || 1)

            var { error } = await supabase
                .from('inventory')
                .update({ quantity: newQuantity })
                .eq('id', existingItem.id)

            if (error) {
                throw new Error(error.message)
            }

            return
        }
    }

    var { error } = await supabase
        .from('inventory')
        .insert({
            ...insertData,
            consumed: false
        })

    if (error) {
        throw new Error(error.message)
    }
}

type CaseItem = Awaited<ReturnType<typeof getCaseItems>> extends Array<infer T> ? T : never;

export async function addInventoryCaseItem(player: Player, caseItem: CaseItem) {
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
                owner: player.uid,
                quantity: caseItem.items.quantity
            })
            .select()
            .single()


        if (!data || error) {
            throw new Error(error?.message)
        }

        await addInventoryItem({
            userID: player.uid,
            itemId: caseItem.itemId,
            redirectTo: '/redeem/' + data?.code,
            expireAt: new Date(new Date().getTime() + caseItem.expireAfter).toISOString()
        })
    } else {
        await addInventoryItem({
            userID: player.uid,
            itemId: caseItem.id
        })
    }
}

type Reward = {
    expireAfter: number | null;
    description?: string | null;
    id?: number;
    name?: string;
    productId?: number | null;
    quantity?: number;
    rarity?: number;
    redirect?: string | null;
    type?: string;
};


export async function receiveReward(player: Player, reward: Reward) {
    if (!player.uid) {
        throw new Error('player.uid is undefined');
    }

    if (reward.productId) {
        if (!reward.expireAfter) {
            throw new Error("expireAfter is null")
        }

        var { data, error } = await supabase
            .from('coupons')
            .insert({
                percent: 1,
                validUntil: new Date(new Date().getTime() + reward.expireAfter).toISOString(),
                productID: reward.productId,
                owner: player.uid
            })
            .select()
            .single()


        if (!data || error) {
            throw new Error(error?.message)
        }

        await addInventoryItem({
            userID: player.uid,
            itemId: reward.id!,
            redirectTo: '/redeem/' + data?.code,
            expireAt: new Date(new Date().getTime() + reward.expireAfter).toISOString()
        })


    } else {
        await addInventoryItem({
            userID: player.uid,
            itemId: reward.id!,
        })
    }
}
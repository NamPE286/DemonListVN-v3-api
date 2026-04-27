import { InventoryIncludedObjectVersions } from "@aws-sdk/client-s3";
import supabase from "@src/client/supabase";
import { getEventQuest } from "@src/services/event-quest.service";
import { getCase as getCaseItems, getItem } from "@src/services/item.service";
import { getPlayer } from "@src/services/player.service";
import type { TInventoryItem } from "@src/types";
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


export async function consumeItem(inventoryItemId: number, quantity: number = 1, data: any = null) {
    const inventoryItem = await getInventoryItem(inventoryItemId);
    const item = await getItem(inventoryItem.itemId);

    if (item.stackable) {
        const consumeQty = quantity || 1;
        const newQuantity = inventoryItem.quantity - consumeQty;

        if (newQuantity < 0) {
            throw new Error('Not enough item')
        } else {
            var { error } = await supabase
                .from('inventory')
                .update({ quantity: newQuantity })
                .eq('id', inventoryItemId);

            if (error) {
                throw new Error(error.message);
            }

            var { error } = await supabase
                .from('itemTransactions')
                .insert({
                    inventoryItemId: inventoryItemId,
                    diff: -consumeQty,
                    data: data
                })
        }
    } else {
        if (inventoryItem.consumed) {
            throw new Error('Item is consumed')
        }

        var { error } = await supabase
            .from('inventory')
            .update({ consumed: true })
            .eq('id', inventoryItemId);

        var { error } = await supabase
            .from('itemTransactions')
            .insert({
                inventoryItemId: inventoryItemId,
                diff: -1,
                data: data
            })

        if (error) {
            throw new Error(error.message);
        }
    }
}

type CouponInventoryItem = Pick<
    TInventoryItem,
    'inventoryId' | 'userID' | 'productId' | 'quantity' | 'useRedirect' | 'created_at' | 'expireAt' | 'defaultExpireAfter'
>;

function getInventoryCouponExpireAfter(item: Pick<CouponInventoryItem, 'created_at' | 'expireAt' | 'defaultExpireAfter'>) {
    if (item.expireAt) {
        const createdAtMs = new Date(item.created_at).getTime();
        const expireAtMs = new Date(item.expireAt).getTime();
        const expireAfter = expireAtMs - createdAtMs;

        if (Number.isFinite(expireAfter) && expireAfter > 0) {
            return expireAfter;
        }
    }

    return item.defaultExpireAfter;
}

async function createCouponForInventoryItem(item: Pick<CouponInventoryItem, 'userID' | 'productId' | 'quantity' | 'created_at' | 'expireAt' | 'defaultExpireAfter'>) {
    if (!item.productId) {
        throw new Error('Item has no product');
    }

    const expireAfter = getInventoryCouponExpireAfter(item);

    if (!expireAfter) {
        throw new Error('expireAfter is null');
    }

    const { data, error } = await supabase
        .from('coupons')
        .insert({
            percent: 1,
            validUntil: new Date(Date.now() + expireAfter).toISOString(),
            productID: item.productId,
            owner: item.userID,
            quantity: item.quantity || 1
        })
        .select('code')
        .single();

    if (error || !data) {
        throw new Error(error?.message || 'Failed to create coupon');
    }

    return data.code;
}

export async function consumeCouponInventoryItem(item: CouponInventoryItem) {
    if (item.useRedirect) {
        await consumeItem(item.inventoryId);
        return { redirectTo: item.useRedirect };
    }

    const code = await createCouponForInventoryItem(item);

    try {
        await consumeItem(item.inventoryId);
    } catch (error) {
        await supabase
            .from('coupons')
            .delete()
            .eq('code', code);

        throw error;
    }

    return { redirectTo: `/redeem/${code}` };
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

    if (insertData.expireAt === null && item.defaultExpireAfter) {
        insertData.expireAt = new Date(new Date().getTime() + item.defaultExpireAfter).toISOString()
    }

    if (item.stackable) {
        const { data: existingItem } = await supabase
            .from('inventory')
            .select('id, quantity')
            .eq('userID', insertData.userID)
            .eq('itemId', insertData.itemId)
            .eq('consumed', false)
            .maybeSingle()

        if (existingItem) {
            const addedQuantity = insertData.quantity || 1
            const newQuantity = existingItem.quantity + addedQuantity

            var { error } = await supabase
                .from('inventory')
                .update({
                    quantity: newQuantity,
                    consumed: false
                })
                .eq('id', existingItem.id)

            if (error) {
                throw new Error(error.message)
            }

            var { error } = await supabase
                .from('itemTransactions')
                .insert({
                    inventoryItemId: existingItem.id,
                    diff: addedQuantity,
                    data: null
                })

            if (error) {
                throw new Error(error.message)
            }

            return
        }
    }

    var { data: newItem, error } = await supabase
        .from('inventory')
        .insert({
            ...insertData,
            consumed: false
        })
        .select()
        .single()

    if (error || !newItem) {
        throw new Error(error?.message || 'Failed to insert item')
    }

    var { error } = await supabase
        .from('itemTransactions')
        .insert({
            inventoryItemId: newItem.id,
            diff: insertData.quantity || 1,
            data: null
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

    await addInventoryItem({
        userID: player.uid,
        itemId: caseItem.itemId,
        expireAt: caseItem.expireAfter
            ? new Date(Date.now() + caseItem.expireAfter).toISOString()
            : null
    })
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

    await addInventoryItem({
        userID: player.uid,
        itemId: reward.id!,
        expireAt: reward.expireAfter
            ? new Date(Date.now() + reward.expireAfter).toISOString()
            : null
    })
}
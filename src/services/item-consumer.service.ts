import supabase from "@src/client/supabase";
import { ItemId } from "@src/const/itemIdConst";
import { addCaseResult, addInventoryCaseItem, consumeItem } from "@src/services/inventory.service";
import { getCase as getCaseItems, getItem } from "@src/services/item.service";
import { getPlayer } from "@src/services/player.service";

type Player = Awaited<ReturnType<typeof getPlayer>>;

export async function consumeCase(player: Player, inventoryItemId: number, itemId: number) {
    await consumeItem(inventoryItemId)

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

export async function consumeQueueBoost(userID: string, levelID: number, numOfDay: number) {
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .match({ userID: userID, itemId: ItemId.QUEUE_BOOST })
        .single()

    if (error) {
        throw new Error(error.message)
    }

    await consumeItem(data.id, numOfDay, { userID, levelID })

}
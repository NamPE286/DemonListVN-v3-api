import { addCaseResult, addInventoryCaseItem } from "@src/services/inventory.service";
import { getCase as getCaseItems, getItem } from "@src/services/item.service";
import { getPlayer } from "@src/services/player.service";

type Player = Awaited<ReturnType<typeof getPlayer>>;

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

export async function consumeQueueBoost(player: Player, inventoryItemId: number, quantity: number) {
    
}
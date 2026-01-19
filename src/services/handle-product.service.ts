import supabase from "@src/client/supabase";
import { sendMessageToChannel } from "@src/services/discord.service";
import { sendNotification } from "@src/services/notification.service";
import type { getOrder } from "@src/services/store.service";
import { FRONTEND_URL } from "@src/config/url";
import { getClan, extendClanBoost } from "@src/services/clan.service";
import { extendPlayerSupporter } from "@src/services/player.service";
import type { Tables } from "@src/types/supabase";
import { getRecord, prioritizeRecord } from "@src/services/record.service";
import { ProductId } from "@src/const/productIdConst";

interface HandleProduct {
    pre: (buyer: Tables<"players">, recipient: Tables<"players">, order: Awaited<ReturnType<typeof getOrder>>) => Promise<void>;
    post: (buyer: Tables<"players">, recipient: Tables<"players">, order: Awaited<ReturnType<typeof getOrder>>) => Promise<void>;
}

export const handleProduct: Map<number, HandleProduct> = new Map()

handleProduct.set(ProductId.SUPPORTER, {
    pre: async (buyer, recipient, order) => {
        await extendPlayerSupporter(recipient.uid!, order.quantity!);

        const { error } = await supabase
            .from("orders")
            .update({ delivered: true })
            .eq("id", order.id)

        if (error) {
            throw new Error(error.message)
        }
    },
    post: async (buyer, recipient, order) => {
        let msg = ''
        let buyerStr = ''

        if (buyer.discord) {
            msg = `<@${buyer.discord}>`
            buyerStr = `<@${buyer.discord}>`
        } else {
            msg = `[${buyer.name}](${FRONTEND_URL}/player/${buyer.uid})`
            buyerStr = `[${buyer.name}](${FRONTEND_URL}/player/${buyer.uid})`
        }

        if (order.giftTo) {
            msg += ` gifted ${order.quantity} month${order.quantity! > 1 ? "s" : ""} of Demon List VN Supporter Role to `

            if (recipient.discord) {
                msg = `<@${recipient.discord}>`
            } else {
                msg = `[${recipient.name}](${FRONTEND_URL}/player/${recipient.uid})`
            }

            await sendNotification({
                content: `You have been gifted ${order.quantity} month${order.quantity! > 1 ? "s" : ""} of Demon List VN Supporter Role!`,
                to: order.giftTo
            })
            await sendMessageToChannel(String(process.env.DISCORD_GENERAL_CHANNEL_ID), `${buyerStr} gifted ${msg} ${order.quantity} month${order.quantity! > 1 ? "s" : ""} of Demon List VN Supporter Role!`)
        } else {
            msg += ` purchased ${order.quantity} month${order.quantity! > 1 ? "s" : ""} of Demon List VN Supporter Role!`
            await sendMessageToChannel(String(process.env.DISCORD_GENERAL_CHANNEL_ID), msg)
        }
    }
})

handleProduct.set(ProductId.CLAN_BOOST, {
    pre: async (buyer, recipient, order) => {
        await extendClanBoost(order.targetClanID!, order.quantity!);

        const { error } = await supabase
            .from("orders")
            .update({ delivered: true })
            .eq("id", order.id)

        if (error) {
            throw new Error(error.message)
        }
    },
    post: async (buyer, recipient, order) => {
        const clan = await getClan(order.targetClanID!)

        let msg = ''

        if (buyer.discord) {
            msg = `<@${buyer.discord}>`
        } else {
            msg = `[${buyer.name}](${FRONTEND_URL}/player/${buyer.uid})`
        }

        msg += ` boosted [${clan.name}](${FRONTEND_URL}/clan/${clan.id}) for ${order.quantity} day${order.quantity! > 1 ? "s" : ""}!`
        await sendMessageToChannel(String(process.env.DISCORD_GENERAL_CHANNEL_ID), msg)
    }
})

handleProduct.set(ProductId.QUEUE_BOOST, {
    pre: async (buyer, recipient, order) => {
        interface OrderData {
            userID: string,
            levelID: number
        }

        const data: OrderData = order.data as unknown as OrderData

        await prioritizeRecord(data.userID, data.levelID, order.quantity! * 86400000)
    },
    post: async (buyer, recipient, order) => {
        let msg = ''

        if (buyer.discord) {
            msg = `<@${buyer.discord}>`
        } else {
            msg = `[${buyer.name}](${FRONTEND_URL}/player/${buyer.uid})`
        }

        msg += ` boosted their record by ${order.quantity} day${order.quantity! > 1 ? 's' : 's'}`
        await sendMessageToChannel(String(process.env.DISCORD_GENERAL_CHANNEL_ID), msg)
    }
})
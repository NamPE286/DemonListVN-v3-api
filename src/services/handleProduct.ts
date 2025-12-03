import supabase from "@src/database/supabase";
import Clan from "@src/lib/classes/Clan";
import type Player from "@src/lib/classes/Player";
import { sendMessageToChannel } from "@src/services/discord";
import { sendNotification } from "@src/services/notification";
import type { getOrder } from "@src/services/store";
import { FRONTEND_URL } from "@src/lib/constants";

interface HandleProduct {
    pre: (buyer: Player, recipient: Player, order: Awaited<ReturnType<typeof getOrder>>) => Promise<void>;
    post: (buyer: Player, recipient: Player, order: Awaited<ReturnType<typeof getOrder>>) => Promise<void>;
}

export const handleProduct: Map<number, HandleProduct> = new Map()

handleProduct.set(1, {
    pre: async (buyer, recipient, order) => {
        console.log(recipient)
        await recipient.extendSupporter(order.quantity!);

        const { error } = await supabase
            .from("orders")
            .update({ delivered: true })
            .eq("id", order.id)

        if (error) {
            throw error
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

handleProduct.set(3, {
    pre: async (buyer, recipient, order) => {
        const clan = new Clan({ id: order.targetClanID! })

        await clan.pull()
        await clan.extendBoost(order.quantity!);

        const { error } = await supabase
            .from("orders")
            .update({ delivered: true })
            .eq("id", order.id)

        if (error) {
            throw error
        }
    },
    post: async (buyer, recipient, order) => {
        const clan = new Clan({ id: order.targetClanID! })
        await clan.pull()

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

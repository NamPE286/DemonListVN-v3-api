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
import { getActiveseason, upgradeToPremium } from "@src/services/battlepass.service";

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
            msg += ` đã tặng ${order.quantity} tháng Geometry Dash VN Supporter Role cho `

            if (recipient.discord) {
                msg = `<@${recipient.discord}>`
            } else {
                msg = `[${recipient.name}](${FRONTEND_URL}/player/${recipient.uid})`
            }

            await sendNotification({
                content: `Bạn đã được tặng ${order.quantity} tháng Geometry Dash VN Supporter Role!`,
                to: order.giftTo
            })
            await sendMessageToChannel(String(process.env.DISCORD_GENERAL_CHANNEL_ID), `${buyerStr} đã tặng ${msg} ${order.quantity} tháng Geometry Dash VN Supporter Role!`)
        } else {
            msg += ` đã mua ${order.quantity} tháng Geometry Dash VN Supporter Role!`
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

        msg += ` đã boost [${clan.name}](${FRONTEND_URL}/clan/${clan.id}) trong ${order.quantity} ngày!`
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

        const { error } = await supabase
            .from("orders")
            .update({ delivered: true })
            .eq("id", order.id)
    },
    post: async (buyer, recipient, order) => {
        let msg = ''

        if (buyer.discord) {
            msg = `<@${buyer.discord}>`
        } else {
            msg = `[${buyer.name}](${FRONTEND_URL}/player/${buyer.uid})`
        }

        msg += ` đã boost record của họ thêm ${order.quantity} ngày`
        await sendMessageToChannel(String(process.env.DISCORD_GENERAL_CHANNEL_ID), msg)
    }
})

handleProduct.set(ProductId.BATTLE_PASS, {
    pre: async (buyer, recipient, order) => {
        const season = await getActiveseason();
        if (!season) {
            throw new Error('No active battle pass season');
        }

        await upgradeToPremium(season.id, recipient.uid!);

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
            msg += ` đã tặng Battle Pass Premium cho `

            if (recipient.discord) {
                msg += `<@${recipient.discord}>`
            } else {
                msg += `[${recipient.name}](${FRONTEND_URL}/player/${recipient.uid})`
            }

            await sendNotification({
                content: `Bạn đã được tặng Battle Pass Premium!`,
                to: order.giftTo
            })
            await sendMessageToChannel(String(process.env.DISCORD_GENERAL_CHANNEL_ID), `${msg}`)
        } else {
            msg += ` đã mua Battle Pass Premium!`
            await sendMessageToChannel(String(process.env.DISCORD_GENERAL_CHANNEL_ID), msg)
        }
    }
})
import supabase from "@src/database/supabase";
import Player from "@src/lib/classes/Player";
import type { Tables, TablesInsert } from "@src/lib/types/supabase";
import { sendNotification } from '@src/lib/client/notification'
import { sendMessageToChannel } from '@src/lib/client/discord';
import type { Response } from 'express';
import { payOS } from '@src/lib/classes/payOS';

interface Item {
    id: number;
    quantity: number;
}

export async function getProducts(ids: number[] | null = []) {
    const query = supabase
        .from("products")
        .select("*")

    if (ids !== null) {
        query.in('id', ids)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
        throw error
    }

    return data
}

export async function getProductByID(id: number) {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq('id', id)
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function addNewOrder(
    orderID: number,
    productID: number | null,
    userID: string,
    quantity: number | null,
    giftTo: string | null,
    amount: number,
    currency: string,
    paymentMethod: string = "Bank Transfer",
    address: string | null = null,
    phone: number | null = null,
    fee: number = 0,
    recipientName: string | null = null,
    targetClanID: number | null = null

) {
    const { error } = await supabase
        .from("orders")
        .insert({
            id: orderID,
            userID: userID,
            state: "PENDING",
            quantity: quantity,
            productID: productID,
            giftTo: giftTo, amount: amount,
            currency: currency,
            paymentMethod: paymentMethod,
            address: address,
            phone: phone,
            fee: fee,
            recipientName: recipientName,
            targetClanID: targetClanID
        })

    if (error) {
        throw error
    }
}

export async function changeOrderState(orderID: number, state: string) {
    const { error } = await supabase
        .from("orders")
        .update({ state: state })
        .eq("id", orderID)

    if (error) {
        throw error
    }
}

export async function getOrders(userID: string) {
    const { data, error } = await supabase
        .from("orders")
        .select("*, products(*), coupons(*), players!giftTo(*, clans!id(*))")
        .eq("userID", userID)
        .order("created_at", { ascending: false })

    if (error) {
        throw error
    }

    return data
}

export async function getCoupon(code: string) {
    const { data, error } = await supabase
        .from('coupons')
        .select('*, products(*)')
        .eq('code', code)
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function redeem(code: string, player: Player) {
    const coupon = await getCoupon(code);
    const product = coupon.products

    if (product === null) {
        throw new Error("Coupon is for discount only");
    }

    delete (coupon as { products?: any }).products


    if (coupon.usageLeft == 0) {
        throw new Error("Coupon is out of usage")
    }

    if (new Date(coupon.created_at) > new Date()) {
        throw new Error("Coupon is expired")
    }

    let amount = product.price * coupon.quantity * (1 - coupon.percent) - coupon.deduct

    if (amount > 0) {
        return;
    }

    coupon.usageLeft--;

    const { error } = await supabase
        .from('coupons')
        .upsert(coupon)

    if (error) {
        throw error
    }

    await player.extendSupporter(coupon.quantity)
}

export async function updateStock(items: TablesInsert<"orderItems">[], products: Tables<"products">[]) {
    const sortedProducts = products.sort((a, b) => a.id - b.id);
    const sortedItems = items.sort((a, b) => a.productID - b.productID);

    for (let i = 0; i < sortedItems.length; i++) {
        const product = sortedProducts[i];
        const item = sortedItems[i];

        if (product.id !== item.productID) {
            throw new Error("Product ID mismatch");
        }

        if (product.stock === null) {
            continue
        }

        if (product.stock < item.quantity!) {
            throw new Error(`Insufficient stock for product ID ${product.id}`);
        }

        if (product.maxQuantity && product.maxQuantity < item.quantity!) {
            throw new Error(`Quantity ${item.quantity} exceeds maximum allowed ${product.maxQuantity} for product ID ${product.id}`);
        }

        product.stock -= item.quantity!;
    }

    const { error } = await supabase
        .from("products")
        .upsert(sortedProducts);

    if (error) {
        throw error;
    }
}

export async function addOrderItems(
    buyer: Player,
    recipientName: string,
    items: TablesInsert<"orderItems">[],
    address: string,
    phone: number,
    paymentMethod: "Bank Transfer" | "COD",
    pending: boolean = false
) {
    items = items.sort((a, b) => a.productID - b.productID);

    const ids: number[] = []
    const orderID = new Date().getTime();

    for (const i of items) {
        i.orderID = orderID
    }

    for (const i of items) {
        ids.push(i.productID)
    }

    const products = (await getProducts(ids)).sort((a, b) => a.id - b.id);
    let amount = 0, fee = 25000;

    if (pending) {
        await updateStock(items, products)
    }

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const product = products[i];

        if (product.price === null) {
            throw new Error(`Product ID ${product.id} has no price`);
        }

        amount += product.price * item.quantity!;
    }

    await addNewOrder(orderID, null, buyer.uid!, null, null, amount, 'VND', paymentMethod, address, phone, fee, recipientName)

    const { error } = await supabase
        .from('orderItems')
        .insert(items)

    if (error) {
        throw error
    }

    return orderID
}

export async function getOrder(id: number) {
    const { data, error } = await supabase
        .from("orders")
        .select("*, orderItems(*, products(*)), products(*), coupons(*), players!giftTo(*, clans!id(*)), orderTracking(*)")
        .eq("id", id)
        .single();

    if (error) {
        throw error;
    }

    if (data.orderTracking) {
        data.orderTracking.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    if (data.productID == 1) {
        data.orderItems.push({
            id: 1,
            productID: 1,
            orderID: data.id,
            quantity: data.quantity || 1,
            created_at: new Date().toISOString(),
            products: await getProductByID(1)
        });
    }

    return data;
}


export async function renewStock(order: Awaited<ReturnType<typeof getOrder>>) {
    const upsertData = []

    if (order.productID == 1) {
        return
    }

    for (const i of order.orderItems) {
        if (!i.products) {
            continue
        }

        if (i.products.stock === null || i.products.stock == undefined) {
            continue
        }

        i.products.stock += i.quantity

        upsertData.push(i.products)
    }

    var { error } = await supabase
        .from("products")
        .upsert(upsertData)

    if (error) {
        console.error("Failed to update products", error)
    }

    var { error } = await supabase
        .from('orderTracking')
        .insert({
            content: "Order cancelled",
            orderID: order.id
        })

    if (error) {
        console.error("Failed to update tracking", error)
    }
}

export async function handlePayment(id: number, res: Response | null = null) {
    const order = await getOrder(id);

    if (order.delivered) {
        if (res) {
            res.redirect(`https://www.demonlistvn.com/supporter/success?id=${id}`)
        }

        return;
    }

    if (order.state == 'CANCELLED') {
        await payOS.cancelPaymentLink(order.id)

        if (res) {
            res.redirect(`https://www.demonlistvn.com/orders/${id}`)
        }

        return;
    }

    const paymentLink = await payOS.getPaymentLinkInformation(id);

    if (order.state != 'EXPIRED' && paymentLink.status == 'EXPIRED') {
        await renewStock(order)
    }

    if (order.state != 'PAID' && paymentLink.status == 'PAID') {
        const products = []

        for (const i of order.orderItems) {
            if (!i.products) {
                continue
            }

            products.push(i.products)
            // @ts-ignore
            delete i.products
        }

        await updateStock(order.orderItems, products)
    }

    order.state = paymentLink.status

    await changeOrderState(id, paymentLink.status);

    if (paymentLink.status == 'PENDING') {
        if (res) {
            res.redirect(`https://pay.payos.vn/web/${paymentLink.id}`)
        }

        return;
    }

    if (paymentLink.status != "PAID") {
        if (res) {
            res.redirect(`https://www.demonlistvn.com/orders/${id}`)
        }

        return;
    }

    const buyer = new Player({ uid: order.userID })
    const recipient = new Player({ uid: order.giftTo ? order.giftTo : order.userID })

    await buyer.pull();
    await recipient.pull();

    if (order.productID === 1) {
        await recipient.extendSupporter(order.quantity!);

        const { error } = await supabase
            .from("orders")
            .update({ delivered: true })
            .eq("id", order.id)

        if (error) {
            throw error
        }
    }

    if (res) {
        res.redirect(`https://www.demonlistvn.com/supporter/success?id=${id}`)
    }

    if (order.productID === 1) {
        let msg = ''
        let buyerStr = ''

        if (buyer.discord) {
            msg = `<@${buyer.discord}>`
            buyerStr = `<@${buyer.discord}>`
        } else {
            msg = `[${buyer.name}](https://demonlistvn.com/player/${buyer.uid})`
            buyerStr = `[${buyer.name}](https://demonlistvn.com/player/${buyer.uid})`
        }

        if (order.giftTo) {
            msg += ` gifted ${order.quantity} month${order.quantity! > 1 ? "s" : ""} of Demon List VN Supporter Role to `

            if (recipient.discord) {
                msg = `<@${recipient.discord}>`
            } else {
                msg = `[${recipient.name}](https://demonlistvn.com/player/${recipient.uid})`
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
}
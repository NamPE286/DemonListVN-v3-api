import supabase from "@src/client/supabase";
import Player from "@src/classes/Player";
import type { Tables, TablesInsert } from "@src/types/supabase";
import { sendNotification } from '@src/services/notification.service'
import { sendMessageToChannel } from '@src/services/discord.service';
import type { Response } from 'express';
import { handleProduct } from "@src/services/handleProduct.service";
import { sepay } from "@src/client/sepay";
import type { SepayWebhookOrder } from "@src/types/sepayWebhook";
import { getClan, extendClanBoost } from "@src/services/clan.service";

interface Item {
    id: number;
    quantity: number;
}

export async function getProducts(ids: number[] | null = []) {
    const query = supabase
        .from("products")
        .select("*")
        .eq('hidden', false)

    if (ids !== null) {
        query.in('id', ids)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
        throw new Error(error.message)
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
        throw new Error(error.message)
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
        throw new Error(error.message)
    }
}

export async function changeOrderState(orderID: number, state: string) {
    const { error } = await supabase
        .from("orders")
        .update({ state: state })
        .eq("id", orderID)

    if (error) {
        throw new Error(error.message)
    }
}

export async function getOrders(userID: string) {
    const { data, error } = await supabase
        .from("orders")
        .select("*, products(*), coupons(*), players!giftTo(*, clans!id(*))")
        .eq("userID", userID)
        .order("created_at", { ascending: false })

    if (error) {
        throw new Error(error.message)
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
        throw new Error(error.message)
    }

    return data
}

export async function redeem(code: string, player: Player) {
    const coupon = await getCoupon(code);
    const product = coupon.products

    if (product === null) {
        throw new Error("Coupon is for discount only");
    }

    if (coupon.productID == 3 && !player.clan) {
        throw new Error("Player is not in a clan")
    }

    delete (coupon as { products?: any }).products


    if (coupon.usageLeft == 0) {
        throw new Error("Coupon is out of usage")
    }

    if (new Date(coupon.validUntil) < new Date()) {
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
        throw new Error(error.message)
    }

    if (coupon.productID == 1) {
        await player.extendSupporter(coupon.quantity)
    }

    if (coupon.productID == 3) {
        await extendClanBoost(player.clan!, coupon.quantity)
    }

    if (coupon.productID == 4) {
        await player.extendSupporter(0, coupon.quantity)
    }

    const orderID = new Date().getTime();
    await addNewOrder(
        orderID,
        coupon.productID,
        player.uid!,
        coupon.quantity,
        null,
        amount,
        'VND',
        'Coupon',
        code,
        null,
        0,
        null,
        coupon.productID == 3 ? player.clan : null
    );

    await changeOrderState(orderID, 'PAID');
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
        throw new Error(error.message);
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
        throw new Error(error.message)
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
        throw new Error(error.message);
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



export async function handlePayment(id: number , sepayOrderData: SepayWebhookOrder) {
    const order = await getOrder(id);

    if (order.state == 'CANCELLED') {
        await sepay.order.cancel(String(id))

        return;
    }

    let paymentStatus: string;

    if (sepayOrderData.order_status === 'CAPTURED') {
        paymentStatus = 'PAID';
    } else if (sepayOrderData.order_status === 'CANCELLED') {
        paymentStatus = 'CANCELLED';
    } else if (sepayOrderData.order_status === 'AUTHENTICATION_NOT_NEEDED') {
        paymentStatus = 'PENDING';
    } else {
        paymentStatus = sepayOrderData.order_status;
    }

    if (order.state != 'EXPIRED' && paymentStatus == 'EXPIRED') {
        await renewStock(order)
    }

    if (order.state != 'PAID' && paymentStatus == 'PAID') {
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

    order.state = paymentStatus

    await changeOrderState(id, paymentStatus);

    if (paymentStatus == 'PENDING' || paymentStatus != "PAID") {
        return;
    }

    const buyer = new Player({ uid: order.userID })
    const recipient = new Player({ uid: order.giftTo ? order.giftTo : order.userID })

    await buyer.pull();
    await recipient.pull();

    if (!handleProduct.has(order.productID!)) {
        return
    }

    const { pre, post } = handleProduct.get(order.productID!)!

    await pre(buyer, recipient, order)
    await post(buyer, recipient, order)
}
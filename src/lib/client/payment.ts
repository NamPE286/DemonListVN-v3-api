import { sepay } from '@src/lib/classes/sepay';

export async function getSepayPaymentLink(
    orderID: number,
    amount: number,
    description: string
): Promise<string | null> {
    const url = sepay.checkout.initCheckoutUrl();
    const payload = sepay.checkout.initOneTimePaymentFields({
        payment_method: 'BANK_TRANSFER',
        order_invoice_number: String(orderID),
        order_amount: amount,
        currency: 'VND',
        order_description: description,
        success_url: `http://localhost:8080/payment/success?orderCode=${orderID}&source=sepay`,
        error_url: `http://localhost:8080/payment/error?orderCode=${orderID}&source=sepay`,
        cancel_url: `http://localhost:8080/payment/cancelled?orderCode=${orderID}&source=sepay`
    });

    const stringifiedPayload = Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [key, String(value)])
    );

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(stringifiedPayload).toString(),
        redirect: 'manual'
    });

    if (response.status === 302) {
        return response.headers.get('location');
    }

    console.log(response.status)

    return null;
}

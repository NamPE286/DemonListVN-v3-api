export interface SepayWebhookOrder {
    id: string
    order_id: string
    order_status: string
    order_currency: string
    order_amount: string
    order_invoice_number: string
    custom_data: any[]
    user_agent?: string | null
    ip_address?: string | null
    order_description?: string | null
}

export interface SepayWebhookTransaction {
    id: string
    payment_method: string
    transaction_id: string
    transaction_type: string
    transaction_date: string
    transaction_status: string
    transaction_amount: string
    transaction_currency: string
    authentication_status?: string | null
    card_number?: string | null
    card_holder_name?: string | null
    card_expiry?: string | null
    card_funding_method?: string | null
    card_brand?: string | null
}

export interface SepayWebhookBody {
    timestamp: number
    notification_type: string
    order: SepayWebhookOrder
    transaction?: SepayWebhookTransaction | null
    customer?: any | null
    agreement?: any | null
}
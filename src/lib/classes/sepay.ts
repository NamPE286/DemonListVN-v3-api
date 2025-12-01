import { SePayPgClient } from 'sepay-pg-node';

export const sepay = new SePayPgClient({
  env: process.env.SEPAY_ENV as "sandbox" | "production",
  merchant_id: process.env.SEPAY_MERCHANT_ID!,
  secret_key: process.env.SEPAY_SECRET_PAY!
});
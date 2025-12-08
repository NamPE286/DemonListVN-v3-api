import { SePayPgClient } from 'sepay-pg-node';

let sepayInstance: SePayPgClient | null = null;

function getSePayClient(): SePayPgClient {
  if (!sepayInstance) {
    sepayInstance = new SePayPgClient({
      env: process.env.SEPAY_ENV as "sandbox" | "production",
      merchant_id: process.env.SEPAY_MERCHANT_ID!,
      secret_key: process.env.SEPAY_SECRET_PAY!
    });
  }
  return sepayInstance;
}

export const sepay = {
  get checkout() {
    return getSePayClient().checkout;
  },
  get order() {
    return getSePayClient().order;
  }
};
import { SePayPgClient } from 'sepay-pg-node';

let sepayInstance: SePayPgClient | null = null;

export const sepay = new Proxy({} as SePayPgClient, {
  get(target, prop) {
    if (!sepayInstance) {
      sepayInstance = new SePayPgClient({
        env: process.env.SEPAY_ENV as "sandbox" | "production",
        merchant_id: process.env.SEPAY_MERCHANT_ID!,
        secret_key: process.env.SEPAY_SECRET_PAY!
      });
    }
    return (sepayInstance as any)[prop];
  }
});
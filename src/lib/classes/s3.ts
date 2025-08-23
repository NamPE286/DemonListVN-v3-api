import { S3Client } from "@aws-sdk/client-s3";

if (!process.env.CF_ACCESS_KEY_ID || !process.env.CF_SECRET_ACCESS_KEY) {
    throw new Error("Missing required environment variables: CF_ACCESS_KEY_ID or CF_SECRET_ACCESS_KEY");
}

export const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CF_ACCESS_KEY_ID,
        secretAccessKey: process.env.CF_SECRET_ACCESS_KEY,
    }
});
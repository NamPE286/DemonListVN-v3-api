import OpenAI from 'openai'

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    defaultHeaders: {
        "cf-aig-authorization": `Bearer ${process.env.CF_AIG_KEY}`,
    },
    baseURL: "https://gateway.ai.cloudflare.com/v1/98e26f44379fc23ac02bd0c2bf84a985/gdvn-ai-gateway/openai"
})

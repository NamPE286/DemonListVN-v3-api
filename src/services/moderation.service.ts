import OpenAI from 'openai'

const openai = new OpenAI()

export interface ModerationResult {
    flagged: boolean
    categories: string[]
    scores: number[]
}

export async function moderateContent(title: string, content: string, imageUrl?: string) {
    const textToCheck = `${title}\n\n${content}`.trim()

    // Build input array: always include text, optionally include image
    const input: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
        { type: 'text', text: textToCheck }
    ]

    if (imageUrl) {
        input.push({
            type: 'image_url',
            image_url: { url: imageUrl }
        })
    }

    const response = await openai.responses.create({
        prompt: {
            "id": "pmpt_698a02385f6881949c289d7ef095c5ad0ce420d8cac42af4"
        }
    });
    
    console.log("OpenAI response: ", response)

    const result: ModerationResult = JSON.parse(response.output_text)

    return result
}

import { openai } from "@src/client/openai"

export interface ModerationResult {
    flagged: boolean
    categories: string[]
    scores: number[]
}

export async function moderateContent(title: string, content: string, imageUrl?: string) {
    const textToCheck = `${title}\n\n${content}`.trim()

    // Build input array: always include text, optionally include image
    const input: any[] = [
        { type: 'input_text', text: textToCheck }
    ]

    if (imageUrl) {
        input.push({
            type: 'input_image',
            image_url: imageUrl
        })
    }

    const regex = /!\[[^\]]*\]\((\S+?)(?:\s+"[^"]*")?\)/g;

    for (const match of content.matchAll(regex)) {
        const url = match[1]; 

        input.push({
            type: 'input_image',
            image_url: url
        });
    }

    const response = await openai.responses.create({
        prompt: {
            "id": "pmpt_698a02385f6881949c289d7ef095c5ad0ce420d8cac42af4"

        },
        input: [
            {
                content: input,
                role: 'user'
            }
        ]
    });

    console.log("OpenAI response: ", response)

    const result: ModerationResult = JSON.parse(response.output_text)

    return result
}

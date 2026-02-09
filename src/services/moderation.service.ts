import OpenAI from 'openai'

const openai = new OpenAI()

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

    const response: any = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input
    })

    let flagged = false;

    for (const result of response.results) {
        if (result.flagged) {
            flagged = true;
            break
        }
    }

    return {
        flagged,
        raw: response
    }
}

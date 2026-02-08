import OpenAI from 'openai'

const openai = new OpenAI()

export interface ModerationResult {
    flagged: boolean
    categories: Record<string, boolean>
    category_scores: Record<string, number>
    /** Which categories were flagged (for user-facing message) */
    flaggedCategories: string[]
    /** The full raw response from OpenAI for admin review */
    raw: any
}

/**
 * Moderate a community post (title + content + optional image) in a SINGLE API call.
 * Uses the omni-moderation-latest model which supports both text and images.
 */
export async function moderatePost(title: string, content: string, imageUrl?: string): Promise<ModerationResult> {
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

    const response = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input
    })

    const result = response.results[0]

    return {
        flagged: result.flagged,
        categories,
        category_scores: result.category_scores as unknown as Record<string, number>,
        flaggedCategories,
        raw: response
    }
}

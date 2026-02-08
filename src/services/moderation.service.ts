import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export interface ModerationResult {
    flagged: boolean
    categories: Record<string, boolean>
    category_scores: Record<string, number>
    /** The full raw response from OpenAI for admin review */
    raw: any
}

/**
 * Check text content using OpenAI omni-moderation-latest model.
 * Combines title and content into a single moderation request.
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
    const response = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input: text
    })

    const result = response.results[0]

    return {
        flagged: result.flagged,
        categories: result.categories as unknown as Record<string, boolean>,
        category_scores: result.category_scores as unknown as Record<string, number>,
        raw: response
    }
}

/**
 * Moderate a community post (title + content).
 * Returns the moderation result and whether the post should be held for review.
 */
export async function moderatePost(title: string, content: string): Promise<ModerationResult> {
    const textToCheck = `${title}\n\n${content}`.trim()
    return moderateContent(textToCheck)
}

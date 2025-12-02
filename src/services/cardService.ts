import { getCard, linkCard, updateCardContent } from '@src/lib/client/card'
import type Player from '@lib/classes/Player'

export class CardService {
    async getCard(id: string) {
        return await getCard(id)
    }

    async linkCard(id: string, user: Player) {
        await linkCard(id, user)
    }

    async updateCardContent(id: string, content: any) {
        await updateCardContent(id, content)
    }
}

export default new CardService()

import { getCase as getCaseItems, getItem } from '@src/lib/client/item'

export class ItemService {
    async getItemById(id: number) {
        const item = await getItem(id)

        if (item.type == 'case') {
            const caseItems = await getCaseItems(id)
            return { ...item, caseItems }
        } else {
            return item
        }
    }
}

export default new ItemService()

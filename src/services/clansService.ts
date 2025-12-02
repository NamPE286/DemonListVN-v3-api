import { getClans } from '@src/lib/client/clan'

export class ClansService {
    async getClans(query: any) {
        return await getClans(query)
    }
}

export default new ClansService()

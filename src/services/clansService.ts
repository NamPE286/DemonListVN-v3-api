import clanService from '@src/services/clanService'

export class ClansService {
    async getClans(query: any) {
        return await clanService.getClans(query)
    }
}

export default new ClansService()

import playerService from '@src/services/playerService'

export class LeaderboardService {
    async getDemonListLeaderboard(query: any) {
        return await playerService.getDemonListLeaderboard(query)
    }

    async getFeaturedListLeaderboard(query: any) {
        return await playerService.getFeaturedListLeaderboard(query)
    }

    async getPlatformerListLeaderboard(query: any) {
        return await playerService.getPlatformerListLeaderboard(query)
    }
}

export default new LeaderboardService()

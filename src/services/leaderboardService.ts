import { getDemonListLeaderboard, getFeaturedListLeaderboard, getPlatformerListLeaderboard } from '@src/lib/client/player'

export class LeaderboardService {
    async getDemonListLeaderboard(query: any) {
        return await getDemonListLeaderboard(query)
    }

    async getFeaturedListLeaderboard(query: any) {
        return await getFeaturedListLeaderboard(query)
    }

    async getPlatformerListLeaderboard(query: any) {
        return await getPlatformerListLeaderboard(query)
    }
}

export default new LeaderboardService()

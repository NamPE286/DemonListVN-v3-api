import { search } from '@lib/client/search'

export class SearchService {
    async search(query: string, options: any) {
        return {
            levels: await search.levels(query, options),
            players: await search.players(query, options)
        }
    }
}

export default new SearchService()

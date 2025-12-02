import { getEvents, getOngoingEvents, getEventProofs } from '@src/lib/client/event'

export class EventsService {
    async getEvents(filter: any) {
        return await getEvents(filter)
    }

    async getOngoingEvents() {
        return await getOngoingEvents()
    }

    async getEventProofs(query: any) {
        return await getEventProofs(null, query)
    }
}

export default new EventsService()

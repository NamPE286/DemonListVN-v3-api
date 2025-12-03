import { getEvents, getOngoingEvents, getEventProofs } from '@src/services/eventService'

// Re-export for backward compatibility
export { getEvents, getOngoingEvents, getEventProofs }

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

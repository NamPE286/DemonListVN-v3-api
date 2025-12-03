import eventService from '@src/services/eventService'

export class EventsService {
    async getEvents(filter: any) {
        return await eventService.getEvents(filter)
    }

    async getOngoingEvents() {
        return await eventService.getOngoingEvents()
    }

    async getEventProofs(query: any) {
        return await eventService.getEventProofs(null, query)
    }
}

export default new EventsService()

import type { Request, Response } from 'express'
import eventsService from '@src/services/eventsService'

export class EventsController {
    async getEvents(req: Request, res: Response) {
        let defaultFilter = {
            search: '',
            eventType: 'all',
            contestType: 'all',
            start: '',
            end: '',
            from: 0,
            to: 50
        }
        const filter: any = { ...defaultFilter, ...req.query }

        try {
            const events = await eventsService.getEvents(filter)

            res.send(events)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getOngoingEvents(req: Request, res: Response) {
        try {
            const events = await eventsService.getOngoingEvents()

            res.send(events)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getEventProofs(req: Request, res: Response) {
        try {
            const proofs = await eventsService.getEventProofs(req.query)

            res.send(proofs)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new EventsController()

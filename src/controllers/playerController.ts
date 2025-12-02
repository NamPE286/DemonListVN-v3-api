import type { Request, Response } from 'express'
import playerService from '@src/services/playerService'
import Player from '@lib/classes/Player'

export class PlayerController {
    async updatePlayer(req: Request, res: Response) {
        try {
            const data = req.body
            const user: Player = res.locals.user

            await playerService.updatePlayer(data, user)
            res.send()
        } catch (error: any) {
            if (error.message === "Missing 'uid' property") {
                res.status(400).send({ message: error.message })

                return
            }

            if (error.message === "Forbidden") {
                res.status(403).send()

                return
            }

            res.status(500).send()
        }
    }

    async createPlayer(req: Request, res: Response) {
        try {
            const user = res.locals.user

            await playerService.createPlayer(user.uid!)
            res.send()
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }

    async getPlayer(req: Request, res: Response) {
        try {
            const { uid } = req.params
            const player = await playerService.getPlayerByUidOrName(uid)

            res.send(player)
        } catch (error) {
            res.status(404).send()
        }
    }

    async getPlayerRecords(req: Request, res: Response) {
        try {
            const records = await playerService.getPlayerRecords(req.params.uid, req.query)

            res.send(records)
        } catch (error) {
            res.status(404).send()
        }
    }

    async getPlayerHeatmap(req: Request, res: Response) {
        try {
            const heatmap = await playerService.getPlayerHeatmap(
                req.params.uid,
                parseInt(req.params.year)
            )

            res.send(heatmap)
        } catch (error) {
            res.status(500).send()
        }
    }

    async updatePlayerHeatmap(req: Request, res: Response) {
        try {
            const user = res.locals.user
            const count = parseInt(req.params.count)

            res.send()
            await playerService.updatePlayerHeatmap(user.uid!, count)
        } catch (error) {
            // Silent fail as per original implementation
        }
    }

    async getPlayerSubmissions(req: Request, res: Response) {
        try {
            const { uid } = req.params
            const submissions = await playerService.getPlayerSubmissions(uid)

            res.send(submissions)
        } catch (error) {
            res.status(500).send()
        }
    }

    async syncPlayerRoles(req: Request, res: Response) {
        try {
            const { user } = res.locals

            await playerService.syncPlayerRoles(user)
            res.send()
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }

    async getPlayerMedals(req: Request, res: Response) {
        try {
            const { id } = req.params
            const medals = await playerService.getPlayerMedals(id)

            res.send(medals)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }

    async getPlayerEvents(req: Request, res: Response) {
        try {
            const { uid } = req.params
            const events = await playerService.getPlayerEvents(uid)

            res.send(events)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }

    async getPlayerCards(req: Request, res: Response) {
        try {
            const { uid } = req.params
            const cards = await playerService.getPlayerCards(uid)

            res.send(cards)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }
}

export default new PlayerController()

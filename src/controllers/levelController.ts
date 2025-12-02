import type { Request, Response } from 'express'
import levelService from '@src/services/levelService'

export class LevelController {
    async updateLevel(req: Request, res: Response) {
        try {
            await levelService.updateLevel(req.body)
            res.send()
        } catch (error: any) {
            if (error.message === "Missing 'id' property") {
                res.status(400).send({ message: error.message })

                return
            }

            res.status(500).send()
        }
    }

    async getLevel(req: Request, res: Response) {
        try {
            const id = levelService.validateLevelId(req.params.id)
            const { fromGD } = req.query
            const level = await levelService.getLevelById(id, !!fromGD)

            res.send(level)
        } catch (error: any) {
            if (error.message === "Invalid ID (ID should only include numeric character)") {
                res.status(400).send({ message: error.message })

                return
            }

            console.error(error)
            res.status(404).send()
        }
    }

    async deleteLevel(req: Request, res: Response) {
        try {
            const id = levelService.validateLevelId(req.params.id)

            await levelService.deleteLevel(id)
            res.send()
        } catch (error: any) {
            if (error.message === "Invalid ID (ID should only include numeric character)") {
                res.status(400).send({ message: error.message })

                return
            }

            res.status(500).send()
        }
    }

    async getLevelRecords(req: Request, res: Response) {
        try {
            const id = levelService.validateLevelId(req.params.id)
            const records = await levelService.getLevelRecords(id, req.query)

            res.send(records)
        } catch (error: any) {
            if (error.message === "Invalid ID (ID should only include numeric character)") {
                res.status(400).send({ message: error.message })

                return
            }

            res.status(404).send()
        }
    }

    async getLevelDeathCount(req: Request, res: Response) {
        try {
            const id = levelService.validateLevelId(req.params.id)
            const deathCount = await levelService.getLevelDeathCount(id)

            res.send(deathCount)
        } catch (error) {
            res.status(500).send()
        }
    }

    async checkLevelInEvent(req: Request, res: Response) {
        try {
            const id = levelService.validateLevelId(req.params.id)
            const { user } = res.locals
            let { type } = req.query

            if (!type) {
                type = 'basic'
            }

            const inEvent = await levelService.checkLevelInEvent(id, user.uid!, String(type))
            
            if (inEvent) {
                res.send()

                return
            }

            res.status(404).send()
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }
}

export default new LevelController()

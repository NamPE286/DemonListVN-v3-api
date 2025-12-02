import type { Request, Response } from 'express'
import recordService from '@src/services/recordService'

export class RecordController {
    async updateRecord(req: Request, res: Response) {
        try {
            await recordService.updateRecord(req.body)
            res.send()
        } catch (error) {
            res.status(500).send()
        }
    }

    async deleteRecord(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { userID, levelID } = req.params
            await recordService.deleteRecord(userID, parseInt(levelID), user)
            res.send()
        } catch (error: any) {
            if (error.message === "Forbidden") {
                res.status(403).send()
            } else {
                res.status(500).send()
            }
        }
    }

    async getRecord(req: Request, res: Response) {
        try {
            const { userID, levelID } = req.params
            const record = await recordService.getRecord(userID, parseInt(levelID))
            res.send(record)
        } catch (error) {
            res.status(500).send()
        }
    }

    async changeSuggestedRating(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { userID, levelID, rating } = req.params
            const result = await recordService.changeSuggestedRating(
                userID,
                parseInt(levelID),
                parseInt(rating),
                user
            )
            res.send(result)
        } catch (error: any) {
            if (error.message === "Unauthorized") {
                res.status(401).send()
            } else {
                res.status(500).send()
            }
        }
    }

    async retrieveRecord(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const record = await recordService.retrieveRecord(user)
            res.send(record)
        } catch (error: any) {
            if (error.message === "Unauthorized") {
                res.status(401).send()
            } else if (error.message === "Too many requests") {
                res.status(429).send()
            } else {
                res.status(500).send()
            }
        }
    }
}

export default new RecordController()

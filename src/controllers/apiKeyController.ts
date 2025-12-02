import type { Request, Response } from 'express'
import apiKeyService from '@src/services/apiKeyService'

export class APIKeyController {
    async getAllAPIKeys(req: Request, res: Response) {
        if (res.locals.authType == 'key') {
            res.status(403).send()

            return
        }

        try {
            const keys = await apiKeyService.getAllAPIKeys(res.locals.user.uid!)

            res.send(keys)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async createAPIKey(req: Request, res: Response) {
        if (res.locals.authType == 'key') {
            res.status(403).send()

            return
        }

        try {
            await apiKeyService.createAPIKey(res.locals.user.uid!)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async deleteAPIKey(req: Request, res: Response) {
        if (res.locals.authType == 'key') {
            res.status(403).send()

            return
        }

        try {
            await apiKeyService.deleteAPIKey(res.locals.user.uid!, req.params.key)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new APIKeyController()

import type { Request, Response } from 'express'
import submitVerdictService from '@src/services/submitVerdictService'

export class SubmitVerdictController {
    async submitVerdict(req: Request, res: Response) {
        const { user } = res.locals

        try {
            await submitVerdictService.submitVerdict(req.body, user)

            res.send()
        } catch (error: any) {
            console.error(error)

            if (error.message === 'Unauthorized') {
                res.status(401).send()

                return
            }

            res.status(500).send()
        }
    }
}

export default new SubmitVerdictController()

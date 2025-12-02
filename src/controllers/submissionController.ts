import type { Request, Response } from 'express'
import submissionService from '@src/services/submissionService'

export class SubmissionController {
    async submitRecord(req: Request, res: Response) {
        const { user } = res.locals

        req.body.userid = user.uid
        req.body.timestamp = Date.now()
        req.body.isChecked = false

        if (req.body.videoLink == undefined ||
            req.body.progress == undefined ||
            req.body.mobile == undefined) {
            res.status(500).send()

            return
        }

        try {
            await submissionService.submitRecord(req.body)

            res.send()
        } catch (err: any) {
            console.error(err)
            res.status(500).send(err)
        }
    }
}

export default new SubmissionController()

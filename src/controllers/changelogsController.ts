import type { Request, Response } from 'express'
import changelogsService from '@src/services/changelogsService'

export class ChangelogsController {
    async publishChangelogs(req: Request, res: Response) {
        try {
            await changelogsService.publishChangelogs()

            res.send()
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }
}

export default new ChangelogsController()

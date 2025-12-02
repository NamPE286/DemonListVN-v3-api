import type { Request, Response } from 'express'
import mergeAccountService from '@src/services/mergeAccountService'

export class MergeAccountController {
    async mergeAccounts(req: Request, res: Response) {
        const { a, b } = req.params

        try {
            await mergeAccountService.mergeAccounts(a, b)

            res.send()
        } catch (error) {
            console.error(error)
            res.status(500).send(error)
        }
    }
}

export default new MergeAccountController()

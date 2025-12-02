import type { Request, Response } from 'express'
import storageService from '@src/services/storageService'

export class StorageController {
    async getPresignedUrl(req: Request, res: Response) {
        const { user } = res.locals
        const { path } = req.query as { path: string }
        let { bucket } = req.query as { bucket?: string }

        if (!bucket) {
            bucket = 'cdn'
        }

        if (!path) {
            res.status(400).send({
                message: 'Missing file path'
            })

            return
        }

        try {
            const url = await storageService.getPresignedUrl(path, bucket, user)

            res.send(url)
        } catch (err: any) {
            console.error(err)

            if (err.message === 'Forbidden') {
                res.status(403).send()

                return
            }

            res.status(500).send()
        }
    }
}

export default new StorageController()

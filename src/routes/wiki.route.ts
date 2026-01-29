import { getWikis } from '@src/services/wiki.service'
import express from 'express'

const router = express.Router()

router.route('/files/*path')
    .get(async (req, res) => {
        // @ts-ignore
        const locales = req.query.locale?.split(',')
        // @ts-ignore
        const path: string = req.params.path.join('/').replace(/\/+$/, '')

        res.send(await getWikis(path, locales))
    })

export default router;
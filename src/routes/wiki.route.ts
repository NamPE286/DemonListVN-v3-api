import { getWikis } from '@src/services/wiki.service'
import express from 'express'

const router = express.Router()

router.route('/files/*path')
    .get(async (req, res) => {
        // @ts-ignore
        const locales = req.query.locale?.split(',')
        // @ts-ignore
        const path: string = req.params.path.join('/').replace(/\/+$/, '')
        const filter: any = {
            sortBy: req.query.sortBy || 'created_at',
            ascending: req.query.ascending || false,
            offset: req.query.offset || 0,
            limit: req.query.limit || 10
        }

        console.log(filter)

        res.send(await getWikis(path, locales, filter))
    })

export default router;
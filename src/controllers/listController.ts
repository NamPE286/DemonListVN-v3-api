import type { Request, Response } from 'express'
import listService from '@src/services/listService'

export class ListController {
    async getDemonList(req: Request, res: Response) {
        try {
            const result = await listService.getDemonList(req.query)

            res.send(result)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getPlatformerList(req: Request, res: Response) {
        try {
            const result = await listService.getPlatformerList(req.query)

            res.send(result)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getFeaturedList(req: Request, res: Response) {
        try {
            const result = await listService.getFeaturedList(req.query)

            res.send(result)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getDemonListRecords(req: Request, res: Response) {
        try {
            const result = await listService.getDemonListRecords(req.query)

            res.send(result)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getFeaturedListRecords(req: Request, res: Response) {
        try {
            const result = await listService.getFeaturedListRecords(req.query)

            res.send(result)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getRandomLevel(req: Request, res: Response) {
        const { list } = req.params
        const { exclude } = req.query

        try {
            const result = await listService.getRandomLevel(String(list), exclude ? String(exclude) : undefined)

            res.send(result)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new ListController()

import type { Request, Response } from 'express'
import provincesService from '@src/services/provincesService'

export class ProvincesController {
    getProvinces(req: Request, res: Response) {
        const provinces = provincesService.getProvinces()
        res.send(provinces)
    }
}

export default new ProvincesController()

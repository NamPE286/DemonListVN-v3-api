import express from 'express'
import rulesController from '@src/controllers/rulesController'

const router = express.Router()

router.route('/')
    .get((req, res) => rulesController.getRules(req, res))

export default router

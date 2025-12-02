import express from 'express'
import rulesController from '@src/controllers/rulesController'

const router = express.Router()

router.route('/')
    .get(rulesController.getRules.bind(rulesController))

export default router

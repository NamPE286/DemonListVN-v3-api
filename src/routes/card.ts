import userAuth from '@src/middleware/userAuth'
import express from 'express'
import cardController from '@src/controllers/cardController'

const router = express.Router()

router.route('/:id')
    .get((req, res) => cardController.getCard(req, res))

router.route('/:id/link')
    .patch(userAuth, (req, res) => cardController.linkCard(req, res))

router.route('/:id/content')
    .patch(userAuth, (req, res) => cardController.updateCardContent(req, res))

export default router

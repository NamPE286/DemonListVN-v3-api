import userAuth from '@src/middleware/userAuth'
import express from 'express'
import cardController from '@src/controllers/cardController'

const router = express.Router()

router.route('/:id')
    .get(cardController.getCard.bind(cardController))

router.route('/:id/link')
    .patch(userAuth, cardController.linkCard.bind(cardController))

router.route('/:id/content')
    .patch(userAuth, cardController.updateCardContent.bind(cardController))

export default router

import express from 'express'

const router = express.Router()

router.route('/:id')
    .get((req, res) => {
        res.send({
            'test': 'test'
        })
    })

export default router
import express, { application } from 'express'
import supabase from '@database/supabase'
import Record from '@lib/classes/Record'
import userAuth from '@src/middleware/userAuth'

const router = express.Router()

router.route('/')
    .post(userAuth, async (req, res) => {
        const { user } = res.locals

        
    })

export default router
import express, { application } from 'express'
import supabase from '@database/supabase'
import Record from '@lib/classes/Record'
import userAuth from '@src/middleware/userAuth'

const router = express.Router()

router.route('/:levelID/:userID')
    .get(async (req, res) => {

    })
    .put(userAuth, async (req, res) => {
        
    })
    .delete(userAuth, async (req, res) => {

    })

export default router
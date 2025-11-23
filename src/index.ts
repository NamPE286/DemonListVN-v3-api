import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import swaggerDocs from '@src/utils/swagger.ts'
import { version } from '../package.json'
import cron from 'node-cron'
import supabase from '@src/database/supabase'
import { httpServerHandler } from "cloudflare:node";

import levelRoute from './routes/level'
import listRoute from './routes/list'
import mergeAccountRoute from './routes/mergeAccount'
import notificationRoute from './routes/notification'
import notificationsRoute from './routes/notifications'
import playerRoute from './routes/player'
import provincesRoute from './routes/provinces'
import recordRoute from './routes/record'
import recordsRoute from './routes/records'
import refreshRoute from './routes/refresh'
import searchRoute from './routes/search'
import submissionRoute from './routes/submission'
import leaderboardRoute from './routes/leaderboard'
import playersRoute from './routes/players'
import APIKeyRoute from './routes/APIKey'
import submitVerdictRoute from './routes/submitVerdict'
import clanRoute from './routes/clan'
import clansRoute from './routes/clans'
import deathCountRoute from './routes/deathCount'
import changelogsRoute from './routes/changelogs'
import eventsRoute from './routes/events'
import eventRoute from './routes/event'
import paymentRoute from './routes/payment'
import ordersRoute from './routes/orders'
import authRoute from './routes/auth'
import levelsRoute from './routes/levels'
import couponRoute from './routes/coupon'
import cardRoute from './routes/card'
import storeRoute from './routes/store'
import orderRoute from './routes/order'
import merchantRoute from './routes/merchant'
import storageRoute from './routes/storage'
import rulesRoute from './routes/rules'
import itemRoute from './routes/item'
import inventoryRoute from './routes/inventory'

const app = express()
const port = 8080

app.use(express.json())
app.use(cors())

cron.schedule('0 */15 * * * *', async () => {
    await supabase.rpc('updateRank')
    await supabase.rpc('updateList')

    console.log("Refreshing...")
});

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    message: "Too many requests, please try again later."
}))

app.get('/', (req, res) => {
    res.send({
        timestamp: new Date().toISOString(),
        version: version
    })
})

app.use('/level', levelRoute)
app.use('/list', listRoute)
app.use('/mergeAccount', mergeAccountRoute)
app.use('/notification', notificationRoute)
app.use('/notifications', notificationsRoute)
app.use('/player', playerRoute)
app.use('/provinces', provincesRoute)
app.use('/record', recordRoute)
app.use('/records', recordsRoute)
app.use('/refresh', refreshRoute)
app.use('/search', searchRoute)
app.use('/submission', submissionRoute)
app.use('/leaderboard', leaderboardRoute)
app.use('/players', playersRoute)
app.use('/APIKey', APIKeyRoute)
app.use('/submitVerdict', submitVerdictRoute)
app.use('/clan', clanRoute)
app.use('/clans', clansRoute)
app.use('/deathCount', deathCountRoute)
app.use('/changelogs', changelogsRoute)
app.use('/events', eventsRoute)
app.use('/event', eventRoute)
app.use('/payment', paymentRoute)
app.use('/orders', ordersRoute)
app.use('/auth', authRoute)
app.use('/levels', levelsRoute)
app.use('/coupon', couponRoute)
app.use('/card', cardRoute)
app.use('/store', storeRoute)
app.use('/order', orderRoute)
app.use('/merchant', merchantRoute)
app.use('/storage', storageRoute)
app.use('/rules', rulesRoute)
app.use('/item', itemRoute)
app.use('/inventory', inventoryRoute)

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
    console.log('Timezone: ' + Intl.DateTimeFormat().resolvedOptions().timeZone)
    swaggerDocs(app, port)
})

export default httpServerHandler({ port: port });
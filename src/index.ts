import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import swaggerDocs from '@src/utils/swagger.ts'
import { version } from '../package.json'

import levelRoute from './routes/levelRoute.ts'
import listRoute from './routes/listRoute.ts'
import mergeAccountRoute from './routes/mergeAccountRoute.ts'
import notificationRoute from './routes/notificationRoute.ts'
import notificationsRoute from './routes/notificationsRoute.ts'
import playerRoute from './routes/playerRoute.ts'
import provincesRoute from './routes/provincesRoute.ts'
import recordRoute from './routes/recordRoute.ts'
import recordsRoute from './routes/recordsRoute.ts'
import refreshRoute from './routes/refreshRoute.ts'
import searchRoute from './routes/searchRoute.ts'
import submissionRoute from './routes/submissionRoute.ts'
import leaderboardRoute from './routes/leaderboardRoute.ts'
import playersRoute from './routes/playersRoute.ts'
import APIKeyRoute from './routes/APIKeyRoute.ts'
import submitVerdictRoute from './routes/submitVerdictRoute.ts'
import clanRoute from './routes/clanRoute.ts'
import clansRoute from './routes/clansRoute.ts'
import deathCountRoute from './routes/deathCountRoute.ts'
import changelogsRoute from './routes/changelogsRoute.ts'
import eventsRoute from './routes/eventsRoute.ts'
import eventRoute from './routes/eventRoute.ts'
import paymentRoute from './routes/paymentRoute.ts'
import ordersRoute from './routes/ordersRoute.ts'
import authRoute from './routes/authRoute.ts'
import levelsRoute from './routes/levelsRoute.ts'
import couponRoute from './routes/couponRoute.ts'
import cardRoute from './routes/cardRoute.ts'
import storeRoute from './routes/storeRoute.ts'
import orderRoute from './routes/orderRoute.ts'
import merchantRoute from './routes/merchantRoute.ts'
import storageRoute from './routes/storageRoute.ts'
import rulesRoute from './routes/rulesRoute.ts'
import itemRoute from './routes/itemRoute.ts'
import inventoryRoute from './routes/inventoryRoute.ts'

import routeLog from '@src/middleware/routeLog.ts'

const app = express()
const port = 8080

app.use(express.json())
app.use(cors())
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    message: "Too many requests, please try again later."
}))
app.use(routeLog)

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
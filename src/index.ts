import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import swaggerDocs from '@src/utils/swagger.ts'
import { version } from '../package.json'

import listRoute from './routes/list.route'
import mergeAccountRoute from './routes/mergeAccount.route'
import notificationsRoute from './routes/notifications.route'
import provincesRoute from './routes/provinces.route'
import recordRoute from './routes/record.route'
import recordsRoute from './routes/records.route'
import refreshRoute from './routes/refresh.route'
import searchRoute from './routes/search.route'
import submissionRoute from './routes/submission.route'
import leaderboardRoute from './routes/leaderboard.route'
import playersRoute from './routes/players.route'
import APIKeyRoute from './routes/APIKey.route'
import submitVerdictRoute from './routes/submitVerdict.route'
import clansRoute from './routes/clans.route'
import deathCountRoute from './routes/deathCount.route'
import changelogsRoute from './routes/changelogs.route'
import eventRoute from './routes/events.route'
import paymentRoute from './routes/payment.route'
import ordersRoute from './routes/orders.route'
import authRoute from './routes/auth.route'
import levelsRoute from './routes/levels.route'
import couponRoute from './routes/coupon.route'
import cardRoute from './routes/card.route'
import storeRoute from './routes/store.route'
import merchantRoute from './routes/merchant.route'
import storageRoute from './routes/storage.route'
import rulesRoute from './routes/rules.route'
import itemRoute from './routes/item.route'
import inventoryRoute from './routes/inventory.route'

import routeLog from '@src/middleware/routeLog.middleware'

const app = express()
const port = 8080

app.use(express.json())
app.use(cors())
app.use(routeLog)

app.get('/', (req, res) => {
    res.send({
        timestamp: new Date().toISOString(),
        version: version
    })
})

app.use('/list', listRoute)
app.use('/mergeAccount', mergeAccountRoute)
app.use('/notifications', notificationsRoute)
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
app.use('/clans', clansRoute)
app.use('/deathCount', deathCountRoute)
app.use('/changelogs', changelogsRoute)
app.use('/events', eventRoute)
app.use('/payment', paymentRoute)
app.use('/orders', ordersRoute)
app.use('/auth', authRoute)
app.use('/levels', levelsRoute)
app.use('/coupon', couponRoute)
app.use('/card', cardRoute)
app.use('/store', storeRoute)
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
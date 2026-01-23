import express from 'express'
import cors from 'cors'
import swaggerDocs from '@src/utils/swagger.ts'
import { version } from '../package.json'
import { httpServerHandler } from 'cloudflare:node';

import listRoute from './routes/list.route'
import mergeAccountRoute from './routes/merge-account.route'
import notificationsRoute from './routes/notifications.route'
import provincesRoute from './routes/provinces.route'
import recordsRoute from './routes/records.route'
import refreshRoute from './routes/refresh.route'
import searchRoute from './routes/search.route'
import submissionRoute from './routes/submission.route'
import leaderboardRoute from './routes/leaderboard.route'
import playersRoute from './routes/players.route'
import playerRoute from './routes/player.route'
import APIKeyRoute from './routes/api-key.route'
import submitVerdictRoute from './routes/submit-verdict.route'
import clansRoute from './routes/clans.route'
import deathCountRoute from './routes/death-count.route'
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
import buyersRoute from './routes/buyers.route'
import mappacksRoute from './routes/mappacks.route'

const app = express()
const port = 8787

app.use(express.json())
app.use(cors())

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
app.use('/records', recordsRoute)
app.use('/refresh', refreshRoute)
app.use('/search', searchRoute)
app.use('/submission', submissionRoute)
app.use('/leaderboard', leaderboardRoute)
app.use('/player', playerRoute)
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
app.use('/buyers', buyersRoute)
app.use('/mappacks', mappacksRoute)

app.listen(port, async () => {
    console.log(`Server started on port ${port}`)
    console.log('Timezone: ' + Intl.DateTimeFormat().resolvedOptions().timeZone)
    await swaggerDocs(app, port)
})

export default httpServerHandler({ port: port });
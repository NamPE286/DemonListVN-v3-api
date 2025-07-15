import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import swaggerDocs from '@src/utils/swagger.ts'
import { version } from '../package.json'
import cron from 'node-cron'
import supabase from '@src/database/supabase'

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

app.use('/level', require(`./routes/level`).default)
app.use('/list', require(`./routes/list`).default)
app.use('/mergeAccount', require(`./routes/mergeAccount`).default)
app.use('/notification', require(`./routes/notification`).default)
app.use('/notifications', require(`./routes/notifications`).default)
app.use('/player', require(`./routes/player`).default)
app.use('/provinces', require(`./routes/provinces`).default)
app.use('/record', require(`./routes/record`).default)
app.use('/records', require(`./routes/records`).default)
app.use('/refresh', require(`./routes/refresh`).default)
app.use('/search', require(`./routes/search`).default)
app.use('/submission', require(`./routes/submission`).default)
app.use('/leaderboard', require(`./routes/leaderboard`).default)
app.use('/players', require(`./routes/players`).default)
app.use('/APIKey', require(`./routes/APIKey`).default)
app.use('/submitVerdict', require(`./routes/submitVerdict`).default)
app.use('/clan', require(`./routes/clan`).default)
app.use('/clans', require(`./routes/clans`).default)
app.use('/deathCount', require(`./routes/deathCount`).default)
app.use('/changelogs', require(`./routes/changelogs`).default)
app.use('/events', require(`./routes/events`).default)
app.use('/event', require(`./routes/event`).default)
app.use('/payment', require(`./routes/payment`).default)
app.use('/orders', require(`./routes/orders`).default)
app.use('/auth', require(`./routes/auth`).default)
app.use('/levels', require(`./routes/levels`).default)
app.use('/coupon', require(`./routes/coupon`).default)
app.use('/card', require(`./routes/card`).default)

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
    console.log('Timezone: ' + Intl.DateTimeFormat().resolvedOptions().timeZone)
    swaggerDocs(app, port)
})

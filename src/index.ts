import express from 'express'
import rateLimit from 'express-rate-limit'
import swaggerDocs from '@src/utils/swagger.ts'
import { version } from '../package.json'

const app = express()
const port = 8080

app.use(express.json())

// app.use(rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     message: "Too many requests, please try again later."
// }))

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

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
    swaggerDocs(app, port)
})
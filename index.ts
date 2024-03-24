import express from 'express'
import levelRoute from './routes/level.ts'
import playerRoute from './routes/player.ts'
import swaggerDocs from '@root/utils/swagger.ts'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
    res.send({
        timestamp: new Date().toISOString()
    })
})

app.use('/level', levelRoute)
app.use('/player', playerRoute)

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`Server started on port ${process.env.EXPRESS_PORT} (local url: http://localhost:${process.env.EXPRESS_PORT})`)
    swaggerDocs(app, parseInt(process.env.EXPRESS_PORT!))
})
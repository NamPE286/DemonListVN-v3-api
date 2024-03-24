import express from 'express'

const app = express()

app.get('/', (req, res) => {
    res.send({
        timestamp: new Date().toISOString()
    })
})

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`Server started on port ${process.env.EXPRESS_PORT} (local url: http://localhost:${process.env.EXPRESS_PORT})`)
})
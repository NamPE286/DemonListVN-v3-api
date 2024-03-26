import express from 'express'
import swaggerDocs from '@src/utils/swagger.ts'
import fs from 'fs'
import path from 'path'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
    res.send({
        timestamp: new Date().toISOString()
    })
})

const routes: string[] = (() => {
    const a: string[] = fs.readdirSync(path.join(__dirname, 'routes'))

    for(let i = 0; i < a.length; i++) {
        a[i] = a[i].substring(0, a[i].length - 3)
    }

    return a
})()

for(const route of routes) {
    app.use('/' + route, require(`./routes/${route}`).default)
}

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`Server started on port ${process.env.EXPRESS_PORT} (local url: http://localhost:${process.env.EXPRESS_PORT})`)
    swaggerDocs(app, parseInt(process.env.EXPRESS_PORT!))
})
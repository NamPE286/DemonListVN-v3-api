// Polyfill for libraries that expect browser globals in Cloudflare Workers
// Must be set before any imports
(globalThis as any).window = globalThis;
(globalThis as any).window.Deno = {}; // Trick new-gd.js into thinking we're in a server environment
(globalThis as any).document = {
    corsURL: '',
    createElement: () => ({}),
    createElementNS: () => ({}),
    getElementsByTagName: () => []
};
(globalThis as any).location = {
    href: '',
    protocol: 'https:',
    host: '',
    hostname: '',
    port: '',
    pathname: '/',
    search: '',
    hash: ''
};

import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import swaggerDocs from '@src/utils/swagger.ts'
import { version } from '../package.json'

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

import routeLog from '@src/middleware/route-log.middleware'

const app = express()

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

// Don't use createServerAdapter since it doesn't work well with Express
// Create a manual Fetch API adapter for Express
function createExpressAdapter(app: any) {
    return async function(request: Request, env: any, ctx: any): Promise<Response> {
        // Pass environment variables to process.env
        if (env) {
            Object.keys(env).forEach(key => {
                process.env[key] = env[key]
            })
        }

        const url = new URL(request.url)
        
        return new Promise<Response>(async (resolve, reject) => {
            // Create a mock req object
            const reqBody = request.body ? await request.arrayBuffer() : null
            
            const req: any = {
                method: request.method,
                url: url.pathname + url.search,
                headers: Object.fromEntries(request.headers.entries()),
                httpVersion: '1.1',
                httpVersionMajor: 1,
                httpVersionMinor: 1,
                connection: {},
                socket: {},
                on: () => {},
                pipe: () => {},
                body: reqBody ? Buffer.from(reqBody) : undefined
            }

            // Create a mock res object
            const chunks: Buffer[] = []
            let statusCode = 200
            let statusMessage = 'OK'
            const headers: Record<string, string | string[]> = {}
            let finished = false

            const sendResponse = () => {
                if (finished) return
                finished = true
                
                const body = Buffer.concat(chunks)
                const responseHeaders = new Headers()
                
                Object.entries(headers).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach(v => responseHeaders.append(key, v))
                    } else if (value) {
                        responseHeaders.set(key, value)
                    }
                })

                resolve(new Response(body, {
                    status: statusCode,
                    statusText: statusMessage,
                    headers: responseHeaders
                }))
            }

            const res: any = {
                statusCode,
                statusMessage,
                finished: false,
                headersSent: false,
                writeHead(code: number, message?: string | any, hdrs?: any) {
                    statusCode = code
                    this.statusCode = code
                    if (typeof message === 'string') {
                        statusMessage = message
                        this.statusMessage = message
                        if (hdrs) Object.assign(headers, hdrs)
                    } else if (message) {
                        Object.assign(headers, message)
                    }
                    this.headersSent = true
                    return this
                },
                setHeader(name: string, value: string | string[]) {
                    headers[name.toLowerCase()] = value
                },
                getHeader(name: string) {
                    return headers[name.toLowerCase()]
                },
                getHeaders() {
                    return headers
                },
                getHeaderNames() {
                    return Object.keys(headers)
                },
                hasHeader(name: string) {
                    return name.toLowerCase() in headers
                },
                removeHeader(name: string) {
                    delete headers[name.toLowerCase()]
                },
                write(chunk: any, encoding?: any, callback?: any) {
                    if (typeof chunk === 'string') {
                        chunks.push(Buffer.from(chunk, encoding || 'utf8'))
                    } else {
                        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
                    }
                    if (callback) callback()
                    return true
                },
                end(chunk?: any, encoding?: any, callback?: any) {
                    if (chunk) {
                        if (typeof chunk === 'string') {
                            chunks.push(Buffer.from(chunk, encoding || 'utf8'))
                        } else {
                            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
                        }
                    }
                    this.finished = true
                    sendResponse()
                    if (callback) callback()
                    if (typeof encoding === 'function') encoding()
                },
                on: () => {},
                once: () => {},
                emit: () => {},
                addListener: () => {},
                removeListener: () => {}
            }

            // Call Express app
            try {
                app(req, res)
            } catch (error) {
                reject(error)
            }
        })
    }
}

const fetchHandler = createExpressAdapter(app)

// Cloudflare Workers export
export default {
    async fetch(request: Request, env: any, ctx: any): Promise<Response> {
        return fetchHandler(request, env, ctx)
    }
}

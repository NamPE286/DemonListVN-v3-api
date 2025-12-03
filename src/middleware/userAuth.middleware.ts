import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken'
import Player from "@src/classes/Player";
import supabase from "@src/client/supabase";

export default async function (req: Request, res: Response, next: NextFunction) {
    res.locals.authenticated = false;
    
    if (!req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer ')) {
        res.status(401).send()
        return
    }

    try {
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET!)
        const uid = String(decoded.sub)
        const player = new Player({ uid: uid })

        try {
            await player.pull()
        } catch { }

        if (player.isBanned) {
            res.status(401).send();
            return;
        }

        if (player.recordCount === 0 && !player.isAdmin) {
            if (req.originalUrl.startsWith('/clan') && req.method != 'GET') {
                res.status(401).send();
                return;
            }
        }

        res.locals.user = player
        res.locals.authType = 'token'
    } catch {
        try {
            const key = req.headers.authorization.split(' ')[1]

            const { data, error } = await supabase
                .from('APIKey')
                .select('*, players(*)')
                .eq('key', key)
                .limit(1)
                .single()

            if (error) {
                throw new Error(error.message)
            }

            res.locals.user = new Player(data.players!)
            res.locals.authType = 'key'

            if (res.locals.user.isBanned) {
                res.status(401).send();
                return;
            }

            if (res.locals.user.recordCount === 0 && !(req.originalUrl.endsWith('submission') && req.method == 'POST') && !res.locals.user.isAdmin) {
                res.status(401).send();
                return;
            }
        } catch {
            res.status(403).send()
            return
        }
    }

    res.locals.authenticated = true;
    next()
}
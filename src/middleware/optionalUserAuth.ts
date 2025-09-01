import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken'
import Player from "@lib/classes/Player";
import supabase from "@src/database/supabase";

export default async function (req: Request, res: Response, next: NextFunction) {
    res.locals.authenticated = false;

    if (!req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer ')) {
        next()
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
            next();
            return;
        }

        if (player.recordCount === 0 && !player.isAdmin) {
            if (req.originalUrl.endsWith('submission') && req.method == 'POST') { }
            else if (req.originalUrl.startsWith('/record') && req.method == 'DELETE') { }
            else if (req.originalUrl.startsWith('/event')) { }
            else if (req.originalUrl.startsWith('/APIKey')) { }
            else if (req.originalUrl.startsWith('/auth')) { }
            else {
                next();
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
                throw error
            }

            res.locals.user = new Player(data.players!)
            res.locals.authType = 'key'

            if (res.locals.user.isBanned) {
                next();
                return;
            }

            if (res.locals.user.recordCount === 0 && !(req.originalUrl.endsWith('submission') && req.method == 'POST') && !res.locals.user.isAdmin) {
                next();
                return;
            }
        } catch {
            next()
            return
        }
    }

    res.locals.authenticated = true;
    next()
}
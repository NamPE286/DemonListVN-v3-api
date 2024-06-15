import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken'
import Player from "@lib/classes/Player";
import supabase from "@src/database/supabase";

export default async function (req: Request, res: Response, next: NextFunction) {
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

        if (player.data.isBanned) {
            res.status(401).send();
            return;
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

            res.locals.user = new Player(data.players)
            res.locals.authType = 'key'

            if (res.locals.user.data.isBanned) {
                res.status(401).send();
                return;
            }
        } catch {
            res.status(403).send()
            return
        }
    }

    next()
}
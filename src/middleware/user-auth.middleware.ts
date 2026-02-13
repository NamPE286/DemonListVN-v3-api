import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken'
import supabase from "@src/client/supabase";
import { getPlayer } from '@src/services/player.service';

export default async function (req: Request, res: Response, next: NextFunction) {
    res.locals.authenticated = false;

    if (!req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer ')) {
        res.status(401).send()
        return
    }

    try {
        const token = req.headers.authorization.split(' ')[1]
        const { data, error } = await supabase.auth.getClaims(token)

        if (error) {
            throw new Error(error.message)
            
            return
        }

        const player = await getPlayer(data?.claims.sub)

        if (player?.isBanned) {
            res.status(401).send();
            return;
        }

        if (!player) {
            res.status(401).send();
            return;
        }

        res.locals.user = player
        res.locals.authType = 'token'
        res.locals.token = token
    } catch {
        try {
            const key = req.headers.authorization.split(' ')[1]

            const { data, error } = await supabase
                .from('APIKey')
                .select('*, players(*, clans!id(*))')
                .eq('key', key)
                .limit(1)
                .single()

            if (error) {
                throw new Error(error.message)
            }

            res.locals.user = data.players!
            res.locals.authType = 'key'
            res.locals.token = key

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
import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken'
import supabase from "@src/client/supabase";
import { getPlayer } from '@src/services/player.service';

export default async function (req: Request, res: Response, next: NextFunction) {
    res.locals.authenticated = false;

    if (!req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer ')) {
        next()
        return
    }

    try {
        const token = req.headers.authorization.split(' ')[1]
        const { data, error } = await supabase.auth.getClaims(token)

        if (error) {
            console.error(error.message)
            res.status(401).send()

            return
        }

        const uid = String(data?.claims.sub)
        let player;

        try {
            player = await getPlayer(uid)
        } catch { }

        if (!player || player.isBanned) {
            next();
            return;
        }

        if (player.recordCount === 0 && !player.isAdmin) {
            if (req.originalUrl.startsWith('/clan') && req.method != 'GET') {
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
                .select('*, players(*, clans!id(*))')
                .eq('key', key)
                .limit(1)
                .single()

            if (error) {
                throw new Error(error.message)
            }

            res.locals.user = data.players
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
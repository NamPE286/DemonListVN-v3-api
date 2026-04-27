import type { Request, Response, NextFunction } from "express";
import supabase from "@src/client/supabase";
import { getPlayer } from '@src/services/player.service';
import logger from "@src/utils/logger";

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
            console.error(error.message)
            res.status(401).send()

            return
        }

        const uid = String(data?.claims.sub)
        let player;

        try {
            player = await getPlayer(uid)
        } catch { }

        if (player?.isBanned) {
            res.status(401).send();
            return;
        }

        if (!player) {
            res.status(401).send();
            return;
        }

        if (!player.isManager && !player.isAdmin) {
            res.status(403).send();
            return;
        }

        res.locals.user = player
        res.locals.authType = 'token'

        if (req.method != 'GET') {
            const body = req.body ? "```" + JSON.stringify(req.body) + "```" : ''
            const msg = `${player.name} performed ${req.method} ${req.originalUrl}`

            await logger.log((body + msg).length <= 2000 ? (msg + body) : msg)
        }
    } catch {
        res.status(403).send()
        return
    }

    res.locals.authenticated = true;

    next()
}

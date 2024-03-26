import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken'
import Player from "@lib/classes/Player";

export default async function (req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer')) {
        res.status(401).send()
        return
    }

    const token = req.headers.authorization?.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!)
        const uid = String(decoded.sub)
        const player = new Player({uid: uid})

        await player.pull()

        res.locals.user = player

    } catch {
        res.status(403).send()
    }

    next()
}
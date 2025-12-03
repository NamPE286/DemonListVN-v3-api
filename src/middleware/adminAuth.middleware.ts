import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken'
import { pullPlayer } from "@src/services/player.service";
import logger from "@src/utils/logger";

export default async function (req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer ')) {
        res.status(401).send()
        return
    }

    const token = req.headers.authorization?.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!)
        const uid = String(decoded.sub)
        const player = await pullPlayer(uid)

        if(!player.isAdmin) {
            return
        }

        let msg = `${player.name} (${player.uid}) performed ${req.method} ${req.originalUrl}`

        if(req.body) {
            msg += `\n\`\`\`json\n// Body content\n${JSON.stringify(req.body, null, 4)}\`\`\``
        }

        logger.log(msg)
    } catch {
        res.status(403).send()
        return
    }

    next()
}
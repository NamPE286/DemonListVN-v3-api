import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken'

export default function (req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer')) {
        res.status(401).send()
        return
    }

    const token = req.headers.authorization?.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!)
        console.log(decoded.sub)

    } catch {
        res.status(403).send()
    }

    next()
}
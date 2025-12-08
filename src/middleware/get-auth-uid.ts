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

    const token = req.headers.authorization.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    const uid = String(decoded.sub)

    res.locals.userId = uid;
    res.locals.authenticated = true;
    
    next()
}
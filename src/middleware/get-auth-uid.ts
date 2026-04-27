import type { Request, Response, NextFunction } from "express";
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
        const { data, error } = await supabase.auth.getUser(token)

        if (error || !data.user) {
            console.error(error?.message || 'Invalid token')
            res.status(401).send()
            return
        }

        res.locals.userId = String(data.user.id);
        res.locals.authenticated = true;

        next()
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}
import type { Request, Response, NextFunction } from "express";

export default async function (req: Request, res: Response, next: NextFunction) {
    const secretKey = req.headers['x-secret-key'];
    
    if (!secretKey || secretKey !== process.env.SEPAY_WEBHOOK_SECRET) {
        res.status(401).send({ message: 'Unauthorized' });
        return;
    }

    next();
}

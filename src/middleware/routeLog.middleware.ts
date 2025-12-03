import type { Request, Response, NextFunction } from "express";

export default function routeLog(req: Request, res: Response, next: NextFunction) {
    if (process.env.DEVELOPMENT != 'true') {
        next();
        return;
    }

    const start = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;

    console.log(`[${new Date().toISOString()}] -> ${method} ${url} - ${ip}`);

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
            `[${new Date().toISOString()}] <- ${method} ${url} ${res.statusCode} - ${duration}ms`
        );
    });


    next()
}
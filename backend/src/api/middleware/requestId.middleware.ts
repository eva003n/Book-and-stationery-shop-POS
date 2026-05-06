import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

export const requestId = (req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID()
    req.id = requestId
    res.setHeader("x-request-id", requestId)
    next()
}
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

export const requestId = (req: Request, res: Response, next: NextFunction) => {
    req["x-request-id"] = randomUUID()
    next()
}
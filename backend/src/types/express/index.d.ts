import { Request, Response } from "express";

declare global {
namespace Express {
    interface Request {
        requestId: string;
        // [key: string]: string
    }
    interface Response {
        jsonApi<T>(status: number, data: T): this
    }
}

}
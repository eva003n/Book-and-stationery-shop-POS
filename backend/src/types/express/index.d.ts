import { Request } from "express";

declare global {
namespace Express {
    interface Request {
        [key: string]: string
    }
}

}
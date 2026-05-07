import morgan, { type TokenIndexer } from "morgan";
import logger from "../logger/index.js";
import { NODE_ENV } from "../config/env.js";
import type { Request, RequestHandler, Response } from "express";

const isProduction = NODE_ENV === "production";

// access custom headers
morgan.token("request-id", (req, res) => req.requestId);

const prodFormat = (
  tokens: TokenIndexer<Request, Response>,
  req: Request,
  res: Response,
) => {
  return JSON.stringify({
    method: tokens.method?.(req, res),
    url: tokens.url?.(req, res),
    status: Number(tokens.status?.(req, res)),
    contentLegth: tokens.res?.(req, res, "content-length"),
    resposeTimeMs: Number(tokens["response-time"]?.(req, res)) + " ms",
    userAgent: tokens["user-agent"]?.(req, res),
    ip: tokens["remote-addr"]?.(req, res),
    requestId: tokens["request-id"]?.(req, res),
  });
};

export const logMiddleware: RequestHandler = isProduction
  ? morgan(prodFormat, {
      stream: {
        write: (message) => logger.info(JSON.parse(message)),
      },
    })
  : morgan("dev");

// src/middleware/log.middleware.ts

import pinoHttp from "pino-http";
import logger from "../logger/index.js";
import type { RequestHandler } from "express";

export const logMiddleware: RequestHandler = pinoHttp({
  logger, // reuse your configured pino instance

  // add request id for logging
  customProps(req, _res) {
    return {
      requestId: req.requestId,
    };
  },

  // assign each response a log level
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },

  // ── Shape of the log line (mirrors your prodFormat fields) ────────────────
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage(req, res, err) {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },

  // Serialize req/res — controls which fields appear on the log line
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        ip: req.remoteAddress,
        userAgent: req.headers["user-agent"],
        requestId: req.requestId,
      };
    },
    res(res) {
      return {
        status: res.statusCode,
        contentLength: res.headers?.["content-length"],
      };
    },
  },

  // Dev: pretty output; Prod: structured JSON (handled by pino transport)
  // pino-http inherits the transport you already set on the logger instance,
  // so nothing extra needed here — dev gets pino-pretty, prod gets JSON.

  // Skip noisy routes
  autoLogging: {
    ignore: (req) => req.url === "/health" || req.url === "/favicon.ico",
  },
});

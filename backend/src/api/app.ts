import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression"

import { logMiddleware } from "./middleware/requestLogger.middleware";
import { requestId } from "./middleware/requestId.middleware";
import { COOKIE_SECRET, CORS_ORIGIN_URLS } from "../config/env";
import errorHandlerMiddleware from "./middleware/error.middleware";
import notFound from "./middleware/notFound.middleware";

const app = express();
// Security
app.use(
  cors({
    origin: CORS_ORIGIN_URLS?.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    optionsSuccessStatus: 200,
  }),
);
app.use(helmet());
// Tracing
app.use(requestId);
// Logging
app.use(logMiddleware);
// preveny too many requests(DDOS)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15min
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: 56,
  }),
);


// Parsing
app.use(cookieParser(COOKIE_SECRET?.split(",")));
app.use(express.json({
    limit: "16kb"
}));
app.use(express.urlencoded({ extended: false }));
// compress request bodies
app.use(compression())

// Endpoints(Routes)

// fallback
app.use(notFound);
// error handling middleware
app.use(errorHandlerMiddleware);

export const server = createServer(app);

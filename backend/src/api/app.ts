import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";

import { COOKIE_SECRET, CORS_ORIGIN_URLS } from "../config/env.js";
// global middlware
import { logMiddleware } from "../middleware/log.middleware.js";
import { requestId } from "../middleware/requestId.middleware.js";
import errorHandlerMiddleware from "../middleware/error.middleware.js";
import notFound from "../middleware/notFound.middleware.js";
import { groupedBoard } from "../queues/index.js";
import authRouter from "../modules/auth/auth.module.js";

const app = express();

/* App level setting */

// tell express to trust headers 1 proxy hop(express app -> ngrok -> (eTims + payment gateway)) as client
app.set("trust proxy", 1);

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

// data exchange(validate content type and accept header)
// app.use(jsonApiMiddleware)

// Parsing
app.use(cookieParser(COOKIE_SECRET?.split(",")));
app.use(
  express.json({
    limit: "16kb",
  }),
);
app.use(express.urlencoded({ extended: false }));
// jsonapi spec adherance
// app.response.jsonApi = function (status = 200, data) {
//   return this.status(status).type("application/vnd.api+json").send(data);
// };
// compress request bodies
app.use(compression());

// Endpoints(Routes)
app.use("/api/v1/admin/queues", groupedBoard.getRouter())
app.use("/api/v1/auth", authRouter)
// fallback
app.use(notFound);
// error handling middleware
app.use(errorHandlerMiddleware);

export const server = createServer(app);

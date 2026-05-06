import { createLogger, format, transports, config } from "winston";
import {
  LOG_LEVEL,
  LOGTAIL_INGESTION_HOST,
  LOGTAIL_SOURCE_TOKEN,
  NODE_ENV,
} from "../config/env.js";
import DailyRotateFile from "winston-daily-rotate-file";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";



const { combine, timestamp, errors, json, printf, colorize } = format;

const infoFilter = format((info) => {
  return info.level === "info" ? info : false;
});

const debugFilter = format((info) => {
  return info.level === "debug" ? info : false;
});

const isProduction = NODE_ENV === "production";

/* Logging formats based on environment */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({
    format: "YYYY-MM-DD hh:mm:ss.SSS A", // 2026-05-05 04:30:22.966 PM
  }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    return `[${timestamp}] [${level}]: ${stack || message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
    }`;
  }),
);

/* Json format for production (machine readable) */
const prodFormat = combine(
  timestamp({
    format: "YYYY-MM-DD hh:mm:ss.SSS A", // 2026-05-05 04:30:22.966 PM
  }),
  errors({ stack: true }),
  json(),
);

/* Log transports */
const logTransports = [];

/* Console (always on) */
logTransports.push(
  new transports.Console({
    format: isProduction ? prodFormat : devFormat,
  }),
);

/* Production only */
if (isProduction) {
  logTransports.push(
    new DailyRotateFile({
      filename: "logs/app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d", //keep files for 14days
    }),
  );

  logTransports.push(
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      level: "error",
    }),
  );

  // Create a Logtail client
  const logtail = new Logtail(LOGTAIL_SOURCE_TOKEN as string, {
    endpoint: LOGTAIL_INGESTION_HOST as string,
  });

  logTransports.push(new LogtailTransport(logtail));
}
const logger = createLogger({
  levels: config.npm.levels,
  level: LOG_LEVEL || "info",
  format: isProduction ? prodFormat : devFormat,
  transports: logTransports,
});

/* levels
{
error: 9,
warn: 1.
info: 2.
http: 3.
verbose: 4,
debug: 5,
silly: 6
}

*/
export default logger;

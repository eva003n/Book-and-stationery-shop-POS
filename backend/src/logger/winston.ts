import {createLogger, format, transports, config} from "winston";
import { LOG_LEVEL } from "../config/env.js";
import "winston-daily-rotate-file"


const infoFilter = format((info) => {
    return info.level === "info"? info: false
})

const debugFilter = format((info) => {
    return info.level === "debug"? info: false
})

const fileRotateTransport = new transports.DailyRotateFile({
    filename:  "app-%DATE%.log",
    datePattern: "DD-MM-YYYY",
    maxFiles: "14d"
})

fileRotateTransport.on("rotate", (oldFileName, newFileName) => {

})
const logger = createLogger({
  levels: config.npm.levels,
  level: LOG_LEVEL || "info",
  format: format.combine(
    // format.colorize({all: true}),
    format.timestamp({
      format: "DD-MM-YYYY hh:mm:ss.SSS A", // 05-05-2026 04:30:22.966 PM
    }),

    // format.printf((info) => `[${info.timestamp}] ${info.level}: ${info.message} `),
    format.json(),
  ),
  transports: [
    fileRotateTransport,
 
    new transports.File({
        filename: "error.log",
        level: "error"
    }),

    new transports.File({
        filename: "debug.log",
        level: "debug",
        format: format.combine(debugFilter(), format.timestamp(), format.json())
    })
  ],
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
export default logger
import express from "express"
import { createServer } from "node:http"
import { morganMiddleware } from "./middleware/requestLogger.middleware.js"
import { requestId } from "./middleware/requestId.middleware.js"


const app = express()

app.use(requestId)
app.use(morganMiddleware)
export const server = createServer(app)



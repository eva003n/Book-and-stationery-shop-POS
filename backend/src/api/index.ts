import { BASE_URL, NODE_ENV, PORT } from "../config/env.js";
import { shutDownRedis } from "../infra/redis/index.js";
import logger from "../logger/index.js";
import { server } from "./app.js";


const port = PORT;
server.listen(port, () => {
  logger.info(
    `Server running at: ${BASE_URL}`,
  );
});

// gracefull shut down
const shutDown = (exitCode: number = 0) => {
    logger.info(`Server Shutting down ... `)

    server.close(() => {
        // close I/O(db, redis connections etc)
        shutDownRedis()
        process.exit(exitCode)
    })
}
process.on("uncaughtException", (err) =>  {
    logger.error(err, "Uncaught exception")
    setTimeout(() => shutDown(1), 1000);
    
})

process.on("unhandledRejection", (err) => {
    logger.error(err, "Uncaught exception" );
    setTimeout(() => shutDown(1), 1000);
    
})

process.on("SIGTERM", () => shutDown())
process.on("SIGINT", () => shutDown())
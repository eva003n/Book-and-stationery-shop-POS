import { BASE_URL, NODE_ENV, PORT } from "../config/env.js";
import logger from "../logger/index.js";
import { server } from "./app.js";

const isProduction = NODE_ENV === "production";

const port = PORT;
server.listen(port, () => {
  logger.info(
    `Server running at: ${!isProduction ? BASE_URL + ":" + PORT : BASE_URL} `,
  );
});

// gracefull shut down
const shutDown = (exitCode: number) => {
    logger.info(`Server Shutting down ... `)

    server.close(() => {
        // close I/O(db connections etc)
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



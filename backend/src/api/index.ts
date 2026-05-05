import { BASE_URL, DATABASE_URL, NODE_ENV, PORT } from "../config/env.js";
import logger from "../logger/winston.js";
import { server } from "./app.js";

console.log(NODE_ENV);
console.log(PORT);
console.log(DATABASE_URL);

const port = PORT
server.listen(port, () => {
    logger.info(`Server running at: ${NODE_ENV === "development"? BASE_URL + ":" + PORT : BASE_URL} `)

})

logger.info("Info message");
logger.error("Error message");
logger.warn("Warning message");

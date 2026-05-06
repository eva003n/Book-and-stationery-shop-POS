import { BASE_URL, DATABASE_URL, NODE_ENV, PORT } from "../config/env.js";
import logger from "../logger/winston.js";
import { server } from "./app.js";

const isProduction = NODE_ENV === "production";

const port = PORT;
server.listen(port, () => {
  logger.info(
    `Server running at: ${!isProduction ? BASE_URL + ":" + PORT : BASE_URL} `,
  );
});

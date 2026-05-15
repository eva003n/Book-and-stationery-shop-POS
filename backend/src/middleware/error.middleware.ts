import type { NextFunction, Request, Response } from "express";
import ApiError from "../shared/utils/ApiError.js";
import logger from "../logger/index.js";

const errorHandlerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ApiError) {
    console.dir(err);

    return res.type("application/problem+json").status(err.status).json(err);
  } else {
    logger.error(err.message);
    // console.dir(err);
    return res
      .type("application/problem+json")
      .status(500)
      .json(
        ApiError.internal(
          req.originalUrl,
          "Server error, something went wrong",
          req.requestId,
        ),
      );
  }
};

export default errorHandlerMiddleware;

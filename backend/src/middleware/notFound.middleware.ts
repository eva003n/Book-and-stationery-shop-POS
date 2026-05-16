import type { Request, Response, NextFunction } from "express";
import ApiError from "../shared/utils/ApiError";

const notFound = async (req: Request, res: Response, next: NextFunction) => {
  res
    .status(404)
    .json(
      ApiError.notFound(
        req.originalUrl,
        "Api endpoint doesn't exist",
        req.requestId,
      ),
    );

  next();
};

export default notFound;
  
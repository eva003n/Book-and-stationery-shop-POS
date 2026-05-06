import type { Request, Response, NextFunction } from "express";
import ApiError from "../../utils/ApiError";

const notFound = async (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json(
      ApiError.notFound(404, req.originalUrl, "Api endpoint doesn't exist"),
    );

    next()
  }

export default notFound;

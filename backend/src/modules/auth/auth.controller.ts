import type { NextFunction, Request, Response } from "express";
import asyncHandler from "../../shared/utils/asynchandler.js";
import ApiError from "../../shared/utils/ApiError.js";
import {
  signInSchema,
  signUpSchema,
  type SignInAuth,
  type SignUpAuth,
} from "../../shared/validator/validators.js";
import { logInUser, registerUser, signOutUser } from "./auth.service.js";
import ApiResponse from "../../shared/utils/ApiResponse.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.config.js";

export const signUp = asyncHandler(async (req: Request, res: Response) => {
  const data = await registerUser(req.validated?.body as SignUpAuth);

  return res.status(201).json(
    new ApiResponse({
      message: "User registered successfully",
      data,
      meta: { requestId: req.requestId },
    }),
  );
});

export const signIn = asyncHandler(async (req: Request, res: Response) => {
  const data = await logInUser(req.validated?.body as SignInAuth, req.headers);

  return res.status(200).json(
    new ApiResponse({
      message: "User signed in successfully",
      data,
      meta: { requestId: req.requestId },
    }),
  );
});

export const signOut = asyncHandler(async (req: Request, res: Response) => {
  await signOutUser(req.headers);

  return res.status(200).json(
    new ApiResponse({
      message: "User signed out successfully",
      data: null,
      meta: { requestId: req.requestId },
    }),
  );
});

// const handler = toNodeHandler(auth);

export const authHandler = toNodeHandler(auth);
/* asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 400) {
        return originalJson(ApiError.badRequest(req.originalUrl, undefined, body))
      }

      return originalJson(new ApiResponse(body));
    };

    return await handler(req, res);
  },
); */

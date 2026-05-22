import { z, ZodType, type ZodIssue } from "zod";
import type { Request, Response, NextFunction, RequestHandler } from "express";

import asyncHandler from "../shared/utils/asynchandler.js";
import ApiError from "../shared/utils/ApiError.js";

type RequestSchema = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

type ValidatedRequestData<TSchema extends RequestSchema> = {
  body: TSchema["body"] extends ZodType ? z.infer<TSchema["body"]> : unknown;
  params: TSchema["params"] extends ZodType ? z.infer<TSchema["params"]> : unknown;
  query: TSchema["query"] extends ZodType ? z.infer<TSchema["query"]> : unknown;
};

type RequestWithValidation<TSchema extends RequestSchema> = Request & {
  requestId?: string;
  validated?: ValidatedRequestData<TSchema>;
};

const formatError = (source: keyof RequestSchema, errors: ZodIssue[]) => {
  return errors.map((error: ZodIssue) => ({
    detail: error.message,
    field: [source, ...error.path],
  }));
};

const normalizeSchema = <TSchema extends RequestSchema | ZodType>(
  schema: TSchema,
): RequestSchema => {
  if (schema instanceof ZodType) {
    return { body: schema } as RequestSchema;
  }

  return schema;
};

export const validate = <TSchema extends RequestSchema | ZodType>(
  schema: TSchema,
) =>
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    type NormalizedSchema = TSchema extends ZodType ? { body: TSchema } : TSchema;
    const request = req as RequestWithValidation<NormalizedSchema>;
    const requestSchema = normalizeSchema(schema);
    const validated = {} as ValidatedRequestData<NormalizedSchema>;
    const errors: ReturnType<typeof formatError> = [];

    const sources = {
      body: req.body,
      params: req.params,
      query: req.query,
    } as const;

    for (const source of Object.keys(requestSchema) as Array<keyof RequestSchema>) {
      const validator = requestSchema[source];
      if (!validator) continue;

      const result = validator.safeParse(sources[source]);

      if (!result.success) {
        errors.push(...formatError(source, result.error.issues));
        continue;
      }

      validated[source] = result.data as never;
    }

    if (errors.length > 0) {
      return next(
        ApiError.badRequest(
          req.originalUrl,
          "Bad request",
          errors,
          request.requestId,
        ),
      );
    }

    request.validated = validated;

    // on successful validation proceed
    next();
  }) as RequestHandler;

import { API_DOC_URI } from "../config/env.js";
import type { ApiErrorObj } from "../validator/validators.js";

class ApiError extends Error {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: Array<Record<string, unknown>> | undefined;
  instance: string;
  requestId?: string | undefined;

  constructor(obj: ApiErrorObj) {
    const { stackTraceLimit } = Error;

    Error.stackTraceLimit = 0;
    super(obj.detail);
    Error.stackTraceLimit = stackTraceLimit;

    this.type = `${API_DOC_URI}${obj.type}`;
    this.title = obj.title;
    this.status = obj.status;
    this.detail = obj.detail;
    this.errors = obj.errors;
    this.instance = obj.instance;
    this.requestId = obj.requestId;

    if (!this.stack) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Generic factory
   */
  static create(obj: ApiErrorObj) {
    return new ApiError(obj);
  }

  static badRequest(
    instance: string,
    detail = "Bad Request",
    errors: Array<Record<string, unknown>>,
    requestId?: string,
  ) {
    return ApiError.create({
      type: "/probs/validation-error",
      title: "Bad Request",
      status: 400,
      detail,
      errors,
      instance,
      requestId,
    });
  }

  static unauthorized(
    instance: string,
    detail = "Unauthorized",
    requestId: string,
  ) {
    return ApiError.create({
      type: "/probs/unauthorized",
      title: "Unauthorized",
      status: 401,
      detail,
      instance,
      requestId,
    });
  }

  static forbidden(instance: string, detail = "Forbidden", requestId?: string) {
    return ApiError.create({
      type: "/probs/forbidden",
      title: "Forbidden",
      status: 403,
      detail,
      instance,
      requestId,
    });
  }

  static notFound(
    instance: string,
    detail = "Resource not found",
    requestId?: string,
  ) {
    return ApiError.create({
      type: "/probs/not-found",
      title: "Not Found",
      status: 404,
      detail,
      instance,
      requestId,
    });
  }

  static conflict(
    instance: string,
    detail = "Conflict occurred",
    errors: Array<Record<string, unknown>>,
    requestId?: string,
  ) {
    return ApiError.create({
      type: "/probs/conflict",
      title: "Conflict",
      status: 409,
      detail,
      errors,
      instance,
      requestId,
    });
  }

  static unprocessable(
    instance: string,
    detail = "Validation failed",
    errors: Array<Record<string, unknown>>,
    requestId?: string,
  ) {
    return ApiError.create({
      type: "/probs/unprocessable",
      title: "Unprocessable Entity",
      status: 422,
      detail,
      errors,
      instance,
      requestId,
    });
  }

  static tooManyRequests(
    instance: string,
    detail = "Too many requests",
    requestId?: string,
  ) {
    return ApiError.create({
      type: "/probs/rate-limit",
      title: "Too Many Requests",
      status: 429,
      detail,
      instance,
      requestId,
    });
  }

  static unsupportedMediaType(instance: string, requestId?: string) {
    return ApiError.create({
      type: "/probs/unsupported-media-type",
      title: "Unsupported Media Type",
      status: 415,
      detail: `Content-Type must be`,
      instance,
      requestId,
    });
  }

  static notAcceptable(instance: string, requestId?: string) {
    return ApiError.create({
      type: "/probs/not-acceptable",
      title: "Not Acceptable",
      status: 406,
      detail: `Accept header must include`,
      instance,
      requestId,
    });
  }

  static internal(
    instance: string,
    detail = "Internal server error",
    requestId?: string,
  ) {
    return ApiError.create({
      type: "/probs/internal",
      title: "Internal Server Error",
      status: 500,
      detail,
      instance,
      requestId,
    });
  }

  static unavailable(
    instance: string,
    detail = "Service unavailable",
    requestId?: string,
  ) {
    return ApiError.create({
      type: "/probs/service-unavailable",
      title: "Service Unavailable",
      status: 503,
      detail,
      instance,
      requestId,
    });
  }

  toJSON() {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      errors: this.errors,
      instance: this.instance,
      requestId: this.requestId,
    };
  }
}

export default ApiError;

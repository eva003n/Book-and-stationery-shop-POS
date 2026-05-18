import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import type { Response } from "express";

export const getAbsolutePath = (fileUrl: string, relativePath: string) => {
  const __fileName = fileURLToPath(fileUrl);
  const __dirName = dirname(__fileName);

  const file = resolve(__dirName, relativePath);

  if (!existsSync(file))
    throw new Error(
      `No .env, .env.development, .env.production files at resolved path: ${file}`,
    );

  return file;
};

export const jsonApiResponse = (res: Response, status = 200, data: any) => {
  return res.status(status).type("application/vnd.api+json").send(data);
};

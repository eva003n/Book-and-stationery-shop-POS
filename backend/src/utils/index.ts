import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

export const getAbsolutePath = (relativePath: string) => {
  const __fileName = fileURLToPath(import.meta.url);
  const __dirName = dirname(__fileName);

  const file = resolve(__dirName, relativePath);

  if (!existsSync(file))
    throw new Error(
      `No .env, .env.development, .env.production files in CWD: ${file}`,
    );

  return file;
};

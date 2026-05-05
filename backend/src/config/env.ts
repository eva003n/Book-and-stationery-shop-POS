import { getAbsolutePath } from "../utils";


export const NODE_ENV = process.env.NODE_ENV || "development";

if (
  NODE_ENV  === "development" ||
  NODE_ENV === "test"
) {
  const { config } = await import("dotenv");

  config({
    path: getAbsolutePath("../../.env"),
  });

  config({
    path: getAbsolutePath(
      `../../.env.${NODE_ENV}`,
    ),
  });
}

export const {BASE_URL, PORT, LOG_LEVEL, DATABASE_URL } = process.env;

import { getAbsolutePath } from "../utils";


 const env = process.env.NODE_ENV || "development";

if (
  env  === "development" ||
  env  === "test"
) {
  const { config } = await import("dotenv");

  config({
    path: getAbsolutePath("../../.env"),
  });

  config({
    path: getAbsolutePath(
      `../../.env.${process.env.NODE_ENV}`,
    ),
  });
}

export const {NODE_ENV, BASE_URL, PORT, LOG_LEVEL,LOGTAIL_SOURCE_TOKEN, LOGTAIL_INGESTION_HOST, DATABASE_URL } = process.env;

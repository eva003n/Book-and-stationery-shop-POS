import type { IncomingHttpHeaders } from "http";

export const toWebHeaders = (headers: IncomingHttpHeaders) => {
  const webHeaders = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue;

    webHeaders.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  return webHeaders;
};
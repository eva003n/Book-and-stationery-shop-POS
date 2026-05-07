import {IncomingMessage} from "node:http";

declare module "http" {
        interface IncomingMessage {
          requestId: string;
          [key: string]: string;
        }
}
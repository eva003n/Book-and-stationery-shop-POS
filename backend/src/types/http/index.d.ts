import {IncomingMessage} from "node:http";

declare module "http" {
        interface IncomingMessage {
          [key: string]: string;
        }
}
import { Server as IOServer } from "socket.io";

declare module "express-serve-static-core" {
  interface Request {
    io: IOServer;
    userSockets: Map<string, string>;
    user?: any;
  }
}

import { Server as IOServer } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      io: IOServer;
      userSockets: Map<string, string>;
      user?: any;
    }
  }
}

export {};
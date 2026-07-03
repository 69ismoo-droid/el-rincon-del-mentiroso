import type { Server as IOServer } from "socket.io";
import type { File } from "multer";

declare global {
  namespace Express {
    interface Request {
      io: IOServer;
      userSockets: Map<string, string>;
      file?: File;
      user?: any;
    }
  }
}

export {};

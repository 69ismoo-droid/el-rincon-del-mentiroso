import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import {
  requireAuth,
  requireActiveUser,
} from "../middleware/auth.js";
import mongoose from "mongoose";
import { routeAsync } from "../middleware/routeAsync.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype);
    cb(null, ok);
  },
});

const requireDb: express.RequestHandler = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: "Base de datos no disponible" });
    return;
  }
  next();
};

function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

router.post(
  "/upload/image",
  requireDb,
  requireAuth,
  requireActiveUser,
  upload.single("image"),
  routeAsync(async (req, res) => {
    if (!cloudinaryConfigured()) {
      res.status(503).json({
        error:
          "Subida de imágenes no configurada. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.",
      });
      return;
    }
    if (!req.file?.buffer) {
      res.status(400).json({ error: "Archivo image requerido (multipart)" });
      return;
    }
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const b64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: process.env.CLOUDINARY_FOLDER ?? "coar-community",
      resource_type: "image",
    });
    res.json({ url: result.secure_url, publicId: result.public_id });
  })
);

export default router;

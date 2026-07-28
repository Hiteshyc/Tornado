import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { env } from "./env.js";

// Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key:    env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

// Cloudinary storage engine for multer
// Files go directly to Cloudinary — no local disk storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "tornado_reports",       // folder name in your Cloudinary account
    resource_type:  "auto",                  // auto-detect image or video
    allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov"],
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB per file
});

// Export cloudinary instance in case we need it elsewhere (e.g. delete files)
export { cloudinary };

import express from "express";
import upload from "../middleware/uploads/upload.middleware.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import chalk from "chalk";

const router = express.Router();

/**
 * Generic file upload endpoint
 * Expects a file in the 'file' field
 * Returns the secure URL from Cloudinary
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const folder = req.body.folder || "turfspot/verification";
    const result = await uploadToCloudinary(req.file.buffer, folder);

    return res.status(200).json({
      success: true,
      url: result,
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error(chalk.red("[UPLOAD ERROR]"), error);
    return res.status(500).json({ success: false, message: "File upload failed" });
  }
});

export default router;

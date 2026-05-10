import AdBanner from "../../models/adBanner.model.js";
import Video from "../../models/video.model.js";
import cloudinary from "../../utils/cloudinary.js";

// Helper for cloudinary upload
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Ad Banners
export const getAdBanners = async (req, res) => {
  try {
    const banners = await AdBanner.find().sort({ order: 1 });
    res.status(200).json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdBanner = async (req, res) => {
  try {
    const bannerData = { ...req.body };
    
    if (req.file) {
      bannerData.imageUrl = await uploadToCloudinary(req.file.buffer, "kridaz/marketing");
    }

    const banner = await AdBanner.create(bannerData);
    res.status(201).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdBanner = async (req, res) => {
  try {
    const bannerData = { ...req.body };

    if (req.file) {
      bannerData.imageUrl = await uploadToCloudinary(req.file.buffer, "kridaz/marketing");
    }

    const banner = await AdBanner.findByIdAndUpdate(req.params.id, bannerData, { new: true });
    res.status(200).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdBanner = async (req, res) => {
  try {
    await AdBanner.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Videos
export const getVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ order: 1 });
    res.status(200).json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createVideo = async (req, res) => {
  try {
    const video = await Video.create(req.body);
    res.status(201).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Video deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public
export const getActiveMarketing = async (req, res) => {
  try {
    const [banners, videos] = await Promise.all([
      AdBanner.find({ isActive: true }).sort({ order: 1 }),
      Video.find({ isActive: true }).sort({ order: 1 }),
    ]);
    res.status(200).json({ success: true, banners, videos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

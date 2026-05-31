// Touch comment to reload nodemon and prisma client yet again final
import { prisma } from "../../config/prisma.js";
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
    const banners = await prisma.adBanner.findMany({
      orderBy: { order: 'asc' }
    });
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

    if (bannerData.order) bannerData.order = Number(bannerData.order);
    if (bannerData.isActive === 'true') bannerData.isActive = true;
    if (bannerData.isActive === 'false') bannerData.isActive = false;

    const banner = await prisma.adBanner.create({
      data: bannerData
    });
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

    if (bannerData.order) bannerData.order = Number(bannerData.order);
    if (bannerData.isActive === 'true') bannerData.isActive = true;
    if (bannerData.isActive === 'false') bannerData.isActive = false;

    const banner = await prisma.adBanner.update({
      where: { id: req.params.id },
      data: bannerData
    });
    res.status(200).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdBanner = async (req, res) => {
  try {
    await prisma.adBanner.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Videos
export const getVideos = async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      orderBy: { order: 'asc' }
    });
    res.status(200).json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createVideo = async (req, res) => {
  try {
    const { title, youtubeUrl, order, isActive } = req.body;
    const videoData = {
      title,
      youtubeUrl,
      order: order ? Number(order) : undefined,
      isActive: isActive === 'true' || isActive === true
    };

    const video = await prisma.video.create({
      data: videoData
    });
    res.status(201).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const { title, youtubeUrl, order, isActive } = req.body;
    const videoData = {
      title,
      youtubeUrl,
      order: order ? Number(order) : undefined,
      isActive: isActive === 'true' || isActive === true
    };

    const video = await prisma.video.update({
      where: { id: req.params.id },
      data: videoData
    });
    res.status(200).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    await prisma.video.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: "Video deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public
export const getActiveMarketing = async (req, res) => {
  try {
    const [banners, videos] = await Promise.all([
      prisma.adBanner.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      prisma.video.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
    ]);
    res.status(200).json({ 
        success: true, 
        banners, 
        videos 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


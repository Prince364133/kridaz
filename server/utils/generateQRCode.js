import QRCode from "qrcode";
import cloudinary from "./cloudinary.js"

async function generateQRCode(url) {
  try {
    // Generate QR code as a data URL for the provided URL
    const qrCodeDataURL = await QRCode.toDataURL(url);

    // Upload the QR code to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(qrCodeDataURL, {
      folder: "BookMySportz/qrcode"
    });

    console.log("QR code URL generated and uploaded successfully!");
    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Error generating or uploading QR code:", error);
    throw error;
  }
}

export default generateQRCode;

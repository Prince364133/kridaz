import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

export const uploadToR2 = async (filePath, key, contentType) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const isManifest = key.endsWith('.m3u8');
    const cacheControl = isManifest 
      ? 'max-age=0, no-cache, no-store, must-revalidate'
      : 'public, max-age=31536000, immutable';

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: cacheControl,
    });


    await r2Client.send(command);
    return { success: true, key };
  } catch (error) {
    console.error(`[R2_UPLOAD_ERROR] Failed to upload ${key}:`, error);
    throw error;
  }
};

export const uploadDirectoryToR2 = async (dirPath, prefix) => {
  const files = await fs.readdir(dirPath);
  const uploadPromises = files.map(async (file) => {
    const filePath = path.join(dirPath, file);
    const key = `${prefix}/${file}`;
    const contentType = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';
    return uploadToR2(filePath, key, contentType);
  });

  return Promise.all(uploadPromises);
};

export const getPresignedUploadUrl = async (key, contentType, expiresIn = 3600) => {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
};

export const deleteFromR2 = async (key) => {
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });
    await r2Client.send(command);
    return { success: true };
  } catch (error) {
    console.error(`[R2_DELETE_ERROR] Failed to delete ${key}:`, error);
    throw error;
  }
};

export const deleteDirectoryFromR2 = async (prefix) => {
  try {
    const { ListObjectsV2Command, DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefix,
    });
    const list = await r2Client.send(listCommand);
    if (!list.Contents || list.Contents.length === 0) return { success: true };

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Delete: {
        Objects: list.Contents.map((obj) => ({ Key: obj.Key })),
      },
    });
    await r2Client.send(deleteCommand);
    return { success: true };
  } catch (error) {
    console.error(`[R2_DELETE_DIR_ERROR] Failed to delete prefix ${prefix}:`, error);
    throw error;
  }
};

export default r2Client;

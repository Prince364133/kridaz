import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const bucketName = process.env.R2_BUCKET_NAME;

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
      AllowedOrigins: ['*'], // Temporary broaden for debugging, can tighten later
      ExposedHeaders: ['ETag', 'x-amz-request-id', 'x-amz-id-2'],
      MaxAgeSeconds: 3000,
    },
  ],
};

async function setCors() {
  try {
    if (!bucketName) throw new Error('R2_BUCKET_NAME is not defined in .env');
    
    console.log(`🚀 Setting CORS for bucket: ${bucketName}...`);
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration,
    });

    await r2Client.send(command);
    console.log('✅ CORS policy updated successfully!');
    console.log('Origins allowed:', corsConfiguration.CORSRules[0].AllowedOrigins.join(', '));
  } catch (err) {
    console.error('❌ Error setting CORS:', err.message);
  }
}

setCors();

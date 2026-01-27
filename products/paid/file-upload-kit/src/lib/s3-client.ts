import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Singleton client to avoid multiple instances in serverless environments
let s3Client: S3Client | null = null;

export const getS3Client = () => {
  if (s3Client) return s3Client;

  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing AWS S3 configuration environment variables.");
  }

  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3Client;
};

export const generatePresignedUrl = async (
  key: string,
  contentType: string,
  expiresIn = 3600
) => {
  const client = getS3Client();
  const bucketName = process.env.AWS_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("Missing AWS_BUCKET_NAME environment variable.");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(client, command, { expiresIn });
};

export const generateDownloadUrl = async (key: string, expiresIn = 3600) => {
    const client = getS3Client();
    const bucketName = process.env.AWS_BUCKET_NAME;

    if (!bucketName) {
      throw new Error("Missing AWS_BUCKET_NAME environment variable.");
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn });
};

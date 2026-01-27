import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client } from "./s3-client";
import { getR2Client } from "./r2-client";

// Helper to get correct client
const getClient = (provider: 's3' | 'r2'): S3Client => {
  return provider === 'r2' ? getR2Client() : getS3Client();
};

const getBucketName = (provider: 's3' | 'r2') => {
  return provider === 'r2' ? process.env.R2_BUCKET_NAME : process.env.AWS_BUCKET_NAME;
};

export const initiateMultipartUpload = async (
  filename: string,
  contentType: string,
  provider: 's3' | 'r2' = 's3'
) => {
  const client = getClient(provider);
  const bucket = getBucketName(provider);
  const key = `uploads/multipart/${Date.now()}-${filename.replace(/\s+/g, '-')}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const { UploadId } = await client.send(command);
  return { UploadId, Key: key };
};

export const generatePartPresignedUrl = async (
  key: string,
  uploadId: string,
  partNumber: number,
  provider: 's3' | 'r2' = 's3'
) => {
  const client = getClient(provider);
  const bucket = getBucketName(provider);

  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return await getSignedUrl(client, command, { expiresIn: 3600 });
};

export const completeMultipartUpload = async (
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[],
  provider: 's3' | 'r2' = 's3'
) => {
  const client = getClient(provider);
  const bucket = getBucketName(provider);

  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
    },
  });

  return await client.send(command);
};

export const abortMultipartUpload = async (
  key: string,
  uploadId: string,
  provider: 's3' | 'r2' = 's3'
) => {
  const client = getClient(provider);
  const bucket = getBucketName(provider);

  const command = new AbortMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
  });

  return await client.send(command);
};

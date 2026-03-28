import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  }
})

export async function getPresignedUploadUrl(key, contentType, orgId, userId) {
  // Validate content type
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png', 
    'image/webp',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  
  if (!allowedTypes.includes(contentType)) {
    throw new Error(`Content type ${contentType} not allowed`)
  }
  
  // Scope key to org and user
  const scopedKey = `${orgId}/${userId}/${key}`
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: scopedKey,
    ContentType: contentType,
    // 25MB limit
    ContentLength: 25 * 1024 * 1024
  })
  
  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300 // 5 minutes
  })
  
  return {
    url: presignedUrl,
    key: scopedKey,
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION
  }
}

export async function getPresignedDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key
  })
  
  return await getSignedUrl(s3Client, command, {
    expiresIn: 3600 // 1 hour
  })
}

export function validateFileKey(key, orgId, userId) {
  // Ensure key starts with orgId/userId to prevent access to other files
  const expectedPrefix = `${orgId}/${userId}/`
  return key.startsWith(expectedPrefix)
}

export function sanitizeFileName(filename) {
  // Remove potentially dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}
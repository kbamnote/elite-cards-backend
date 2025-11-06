require('dotenv').config();
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_BUCKET_NAME,
} = process.env;

// Basic validation of required env vars (don’t log secrets)
if (!AWS_REGION) {
  console.warn('AWS_REGION is not set; S3 operations may fail.');
}
if (!AWS_BUCKET_NAME) {
  console.warn('AWS_BUCKET_NAME is not set; uploads will fail.');
}

AWS.config.update({
  region: AWS_REGION,
  credentials: new AWS.Credentials({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  }),
});

const s3 = new AWS.S3();

async function uploadToS3(file, folder = '') {
  try {
    if (!AWS_BUCKET_NAME) throw new Error('Missing AWS_BUCKET_NAME');
    if (!file) throw new Error('No file provided for upload');

    const filename = file.originalname || path.basename(file.path || `file_${Date.now()}`);
    const key = folder ? `${folder}/${Date.now()}_${filename}` : `${Date.now()}_${filename}`;
    const contentType = file.mimetype || 'application/octet-stream';

    const body = file.buffer
      ? file.buffer
      : file.path
      ? fs.readFileSync(file.path)
      : (() => {
          throw new Error('File has no buffer or path');
        })();

    const params = {
      Bucket: AWS_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    };

    const result = await s3.upload(params).promise();
    return { key: result.Key, url: result.Location, eTag: result.ETag };
  } catch (err) {
    console.error('S3 upload error:', err.message);
    throw new Error('Failed to upload to S3');
  }
}

async function deleteFromS3(key) {
  try {
    if (!AWS_BUCKET_NAME) throw new Error('Missing AWS_BUCKET_NAME');
    if (!key) throw new Error('No key provided for deletion');

    const params = { Bucket: AWS_BUCKET_NAME, Key: key };
    await s3.deleteObject(params).promise();
    return { success: true };
  } catch (err) {
    console.error('S3 delete error:', err.message);
    throw new Error('Failed to delete from S3');
  }
}

async function getSignedUrl(key, expiresInSeconds = 60) {
  try {
    if (!AWS_BUCKET_NAME) throw new Error('Missing AWS_BUCKET_NAME');
    if (!key) throw new Error('No key provided for signed URL');

    const params = { Bucket: AWS_BUCKET_NAME, Key: key, Expires: expiresInSeconds };
    // Wrap callback API in a Promise for consistency
    const url = await new Promise((resolve, reject) => {
      s3.getSignedUrl('getObject', params, (err, url) => {
        if (err) return reject(err);
        resolve(url);
      });
    });
    return url;
  } catch (err) {
    console.error('S3 signed URL error:', err.message);
    throw new Error('Failed to generate S3 signed URL');
  }
}

module.exports = {
  uploadToS3,
  deleteFromS3,
  getSignedUrl,
};
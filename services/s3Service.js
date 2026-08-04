// services/s3Service.js

const { v4: uuidv4 } = require('uuid');
const { s3, bucket } = require('../config/s3');

const s3Service = {
  // Upload a file to S3
  uploadFile: async (file, userId) => {
    const key = `${userId}/${uuidv4()}-${file.originalname}`;
    const params = {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private'
    };

    try {
      const result = await s3.upload(params).promise();
      return {
        key: result.Key,
        location: result.Location,
        etag: result.ETag
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('File upload failed');
    }
  },

  // Download a file from S3
  getFileStream: (key) => {
    const params = {
      Bucket: bucket,
      Key: key
    };

    return s3.getObject(params).createReadStream();
  },

  // Delete a file from S3
  deleteFile: async (key) => {
    const params = {
      Bucket: bucket,
      Key: key
    };

    try {
      await s3.deleteObject(params).promise();
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('File deletion failed');
    }
  },

  // Generate a pre-signed URL for file download. responseContentType/responseContentDisposition
  // let the caller control inline-preview vs forced-download without a second round trip.
  getSignedUrl: async (key, { expirationTime = 300, responseContentType, responseContentDisposition } = {}) => {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: expirationTime,
      ...(responseContentType && { ResponseContentType: responseContentType }),
      ...(responseContentDisposition && { ResponseContentDisposition: responseContentDisposition })
    };

    try {
      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw new Error('Failed to generate download URL');
    }
  },

  // Copy a file within S3
  copyFile: async (sourceKey, destinationKey) => {
    const params = {
      Bucket: bucket,
      CopySource: `${bucket}/${sourceKey}`,
      Key: destinationKey
    };

    try {
      await s3.copyObject(params).promise();
    } catch (error) {
      console.error('S3 copy error:', error);
      throw new Error('File copy failed');
    }
  },

  // Check if a file exists in S3
  fileExists: async (key) => {
    const params = {
      Bucket: bucket,
      Key: key
    };

    try {
      await s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  },

  // List files in a "directory"
  listFiles: async (prefix) => {
    const params = {
      Bucket: bucket,
      Prefix: prefix
    };

    try {
      const data = await s3.listObjectsV2(params).promise();
      return data.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified
      }));
    } catch (error) {
      console.error('S3 list error:', error);
      throw new Error('Failed to list files');
    }
  },

  // Get file metadata
  getFileMetadata: async (key) => {
    const params = {
      Bucket: bucket,
      Key: key
    };

    try {
      const data = await s3.headObject(params).promise();
      return {
        contentType: data.ContentType,
        contentLength: data.ContentLength,
        etag: data.ETag,
        lastModified: data.LastModified
      };
    } catch (error) {
      console.error('S3 metadata error:', error);
      throw new Error('Failed to get file metadata');
    }
  }
};

module.exports = s3Service;
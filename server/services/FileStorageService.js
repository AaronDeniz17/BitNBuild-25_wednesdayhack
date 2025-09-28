// FileStorageService - Handles file uploads with adapter pattern
// Supports Supabase, Firebase, and LocalDev providers

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Base FileStorageService interface
class FileStorageService {
  constructor() {
    this.provider = this.detectProvider();
  }

  detectProvider() {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return 'supabase';
    } else if (process.env.FIREBASE_STORAGE_BUCKET) {
      return 'firebase';
    } else {
      return 'localdev';
    }
  }

  async uploadFile(file, bucket, folder = '') {
    throw new Error('uploadFile must be implemented by provider');
  }

  async deleteFile(fileUrl) {
    throw new Error('deleteFile must be implemented by provider');
  }

  async getFileUrl(filePath) {
    throw new Error('getFileUrl must be implemented by provider');
  }
}

// Supabase provider
class SupabaseFileStorageService extends FileStorageService {
  constructor() {
    super();
    if (this.provider !== 'supabase') {
      throw new Error('Supabase provider requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    
    const { createClient } = require('@supabase/supabase-js');
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async uploadFile(file, bucket, folder = '') {
    try {
      const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
      
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        success: true,
        fileUrl: urlData.publicUrl,
        filePath: fileName,
        bucket
      };

    } catch (error) {
      console.error('Supabase file upload error:', error);
      throw error;
    }
  }

  async deleteFile(fileUrl) {
    try {
      // Extract bucket and file path from URL
      const urlParts = fileUrl.split('/');
      const bucket = urlParts[urlParts.length - 2];
      const fileName = urlParts[urlParts.length - 1];

      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) throw error;

      return { success: true };

    } catch (error) {
      console.error('Supabase file delete error:', error);
      throw error;
    }
  }

  async getFileUrl(filePath) {
    try {
      const urlParts = filePath.split('/');
      const bucket = urlParts[0];
      const fileName = urlParts.slice(1).join('/');

      const { data } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        success: true,
        fileUrl: data.publicUrl
      };

    } catch (error) {
      console.error('Supabase get file URL error:', error);
      throw error;
    }
  }
}

// Firebase provider
class FirebaseFileStorageService extends FileStorageService {
  constructor() {
    super();
    if (this.provider !== 'firebase') {
      throw new Error('Firebase provider requires FIREBASE_STORAGE_BUCKET');
    }
    
    const { Storage } = require('@google-cloud/storage');
    this.storage = new Storage({
      projectId: process.env.FIREBASE_PROJECT_ID,
      keyFilename: process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    });
    this.bucket = this.storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
  }

  async uploadFile(file, bucket, folder = '') {
    try {
      const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
      const fileRef = this.bucket.file(fileName);

      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype
        }
      });

      // Make file publicly accessible
      await fileRef.makePublic();

      const fileUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;

      return {
        success: true,
        fileUrl,
        filePath: fileName,
        bucket: process.env.FIREBASE_STORAGE_BUCKET
      };

    } catch (error) {
      console.error('Firebase file upload error:', error);
      throw error;
    }
  }

  async deleteFile(fileUrl) {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folder = urlParts[urlParts.length - 2];
      const filePath = `${folder}/${fileName}`;

      await this.bucket.file(filePath).delete();

      return { success: true };

    } catch (error) {
      console.error('Firebase file delete error:', error);
      throw error;
    }
  }

  async getFileUrl(filePath) {
    try {
      const fileRef = this.bucket.file(filePath);
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
      });

      return {
        success: true,
        fileUrl: url
      };

    } catch (error) {
      console.error('Firebase get file URL error:', error);
      throw error;
    }
  }
}

// Local development provider
class LocalDevFileStorageService extends FileStorageService {
  constructor() {
    super();
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDir();
  }

  ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    // Create bucket directories
    const buckets = ['profile-pictures', 'project-attachments', 'chat-files', 'portfolio-images'];
    buckets.forEach(bucket => {
      const bucketDir = path.join(this.uploadsDir, bucket);
      if (!fs.existsSync(bucketDir)) {
        fs.mkdirSync(bucketDir, { recursive: true });
      }
    });
  }

  async uploadFile(file, bucket, folder = '') {
    try {
      const fileName = `${uuidv4()}-${file.originalname}`;
      const filePath = path.join(this.uploadsDir, bucket, folder, fileName);
      const relativePath = path.join(bucket, folder, fileName);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, file.buffer);

      // Create public URL (assuming server serves /uploads)
      const fileUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

      return {
        success: true,
        fileUrl,
        filePath: relativePath,
        bucket
      };

    } catch (error) {
      console.error('LocalDev file upload error:', error);
      throw error;
    }
  }

  async deleteFile(fileUrl) {
    try {
      // Extract file path from URL
      const relativePath = fileUrl.replace('/uploads/', '');
      const filePath = path.join(this.uploadsDir, relativePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return { success: true };

    } catch (error) {
      console.error('LocalDev file delete error:', error);
      throw error;
    }
  }

  async getFileUrl(filePath) {
    try {
      const fullPath = path.join(this.uploadsDir, filePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error('File not found');
      }

      const fileUrl = `/uploads/${filePath.replace(/\\/g, '/')}`;

      return {
        success: true,
        fileUrl
      };

    } catch (error) {
      console.error('LocalDev get file URL error:', error);
      throw error;
    }
  }

  // Helper method to serve files in development
  static serveUploads(app) {
    app.use('/uploads', require('express').static(path.join(process.cwd(), 'uploads')));
  }
}

// Factory function to create appropriate FileStorageService
function createFileStorageService() {
  const provider = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? 'supabase' :
                   process.env.FIREBASE_STORAGE_BUCKET ? 'firebase' : 'localdev';

  console.log(`FileStorageService: Using ${provider} provider`);

  switch (provider) {
    case 'supabase':
      return new SupabaseFileStorageService();
    case 'firebase':
      return new FirebaseFileStorageService();
    case 'localdev':
    default:
      return new LocalDevFileStorageService();
  }
}

// Export singleton instance
const fileStorageService = createFileStorageService();

module.exports = {
  FileStorageService,
  SupabaseFileStorageService,
  FirebaseFileStorageService,
  LocalDevFileStorageService,
  createFileStorageService,
  fileStorageService
};

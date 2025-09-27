// Supabase Storage configuration for GigCampus
// Handles file uploads, profile pictures, and project attachments
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for storage only
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Storage helper functions
const storage = {
  // Upload file to Supabase Storage
  uploadFile: async (bucket, path, file, options = {}) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          ...options
        });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get public URL for file
  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },
  
  // Delete file from storage
  deleteFile: async (bucket, path) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // List files in bucket
  listFiles: async (bucket, path = '') => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Storage list error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Download file
  downloadFile: async (bucket, path) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Storage download error:', error);
      return { success: false, error: error.message };
    }
  }
};

// File type validation
const fileValidation = {
  // Allowed image types
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // Allowed document types
  allowedDocumentTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ],
  
  // Validate file type
  validateFileType: (file, type = 'image') => {
    const allowedTypes = type === 'image' ? 
      fileValidation.allowedImageTypes : 
      fileValidation.allowedDocumentTypes;
    
    return allowedTypes.includes(file.mimetype);
  },
  
  // Validate file size (in bytes)
  validateFileSize: (file, maxSize = 10 * 1024 * 1024) => { // 10MB default
    return file.size <= maxSize;
  }
};

// Storage buckets configuration
const buckets = {
  PROFILE_PICTURES: 'profile-pictures',
  PROJECT_ATTACHMENTS: 'project-attachments',
  CHAT_FILES: 'chat-files',
  PORTFOLIO_IMAGES: 'portfolio-images'
};

module.exports = { 
  storage, 
  fileValidation, 
  buckets,
  supabase 
};

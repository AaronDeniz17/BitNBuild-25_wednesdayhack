// Client-side Supabase Storage configuration for GigCampus
// Handles file uploads, profile pictures, and project attachments
import { createClient } from '@supabase/supabase-js';

// Supabase configuration using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage helper functions
export const storage = {
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
export const fileValidation = {
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
    
    return allowedTypes.includes(file.type);
  },
  
  // Validate file size (in bytes)
  validateFileSize: (file, maxSize = 10 * 1024 * 1024) => { // 10MB default
    return file.size <= maxSize;
  }
};

// Storage buckets configuration
export const buckets = {
  PROFILE_PICTURES: 'profile-pictures',
  PROJECT_ATTACHMENTS: 'project-attachments',
  CHAT_FILES: 'chat-files',
  PORTFOLIO_IMAGES: 'portfolio-images'
};

export default supabase;

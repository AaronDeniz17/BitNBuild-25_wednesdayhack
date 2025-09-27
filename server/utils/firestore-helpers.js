// Firestore query helper functions
// Provides simplified queries and error handling

const { db } = require('../config/firebase');

const firestoreHelpers = {
  async getDocumentById(collection, id) {
    try {
      const docRef = db.collection(collection).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return { success: false, error: 'Document not found' };
      }
      
      return {
        success: true,
        data: {
          id: doc.id,
          ...doc.data()
        }
      };
    } catch (error) {
      console.error(`Error getting ${collection} document:`, error);
      return {
        success: false,
        error: 'Failed to retrieve document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  },
  
  async getDocuments(collection, filters = {}, options = {}) {
    try {
      // Start with the collection reference
      let query = db.collection(collection);
      
      // Apply basic filters without complex indexing requirements
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          query = query.where(field, '==', value);
        }
      });
      
      // Simple ordering by a single field
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDirection || 'desc');
      }
      
      // Apply limit if specified
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const snapshot = await query.get();
      const documents = [];
      
      snapshot.forEach(doc => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        data: documents
      };
    } catch (error) {
      console.error(`Error querying ${collection}:`, error);
      return {
        success: false,
        error: 'Failed to query documents',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }
};

module.exports = firestoreHelpers;
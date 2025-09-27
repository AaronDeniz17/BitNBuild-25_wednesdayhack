// Database operations helper for GigCampus
// Provides consistent error handling for database operations

const handleError = require('./error-handler');

const dbOperations = {
  async getDocument(collection, id, req, res) {
    try {
      const doc = await collection.doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      handleError(error, req, res);
      return null;
    }
  },
  
  async queryCollection(collection, query, req, res) {
    try {
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      handleError(error, req, res);
      return null;
    }
  }
};

module.exports = dbOperations;
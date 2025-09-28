// ChatService - Handles real-time chat with file upload
// Implements adapter pattern for different providers (Supabase, Firebase, LocalDev)

const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');

// Base ChatService interface
class ChatService {
  constructor() {
    this.provider = this.detectProvider();
  }

  detectProvider() {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return 'supabase';
    } else if (process.env.FIREBASE_DATABASE_URL) {
      return 'firebase';
    } else {
      return 'localdev';
    }
  }

  async sendMessage(projectId, senderId, text, fileUrl = null) {
    throw new Error('sendMessage must be implemented by provider');
  }

  async getMessages(projectId, limit = 50) {
    throw new Error('getMessages must be implemented by provider');
  }

  async subscribeToMessages(projectId, callback) {
    throw new Error('subscribeToMessages must be implemented by provider');
  }

  async unsubscribeFromMessages(projectId) {
    throw new Error('unsubscribeFromMessages must be implemented by provider');
  }
}

// Supabase provider
class SupabaseChatService extends ChatService {
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

  async sendMessage(projectId, senderId, text, fileUrl = null) {
    try {
      const messageId = uuidv4();
      const message = {
        id: messageId,
        project_id: projectId,
        sender_id: senderId,
        text,
        file_url: fileUrl,
        created_at: new Date().toISOString(),
        is_read: false,
        read_by: []
      };

      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert([message])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: data
      };

    } catch (error) {
      console.error('Supabase send message error:', error);
      throw error;
    }
  }

  async getMessages(projectId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        messages: data.reverse() // Return in chronological order
      };

    } catch (error) {
      console.error('Supabase get messages error:', error);
      throw error;
    }
  }

  async subscribeToMessages(projectId, callback) {
    try {
      const subscription = this.supabase
        .channel(`project-${projectId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`
        }, callback)
        .subscribe();

      return subscription;

    } catch (error) {
      console.error('Supabase subscription error:', error);
      throw error;
    }
  }

  async unsubscribeFromMessages(subscription) {
    try {
      if (subscription) {
        await this.supabase.removeChannel(subscription);
      }
    } catch (error) {
      console.error('Supabase unsubscribe error:', error);
    }
  }
}

// Firebase provider
class FirebaseChatService extends ChatService {
  constructor() {
    super();
    if (this.provider !== 'firebase') {
      throw new Error('Firebase provider requires FIREBASE_DATABASE_URL');
    }
  }

  async sendMessage(projectId, senderId, text, fileUrl = null) {
    try {
      const messageId = uuidv4();
      const message = {
        id: messageId,
        project_id: projectId,
        sender_id: senderId,
        text,
        file_url: fileUrl,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        is_read: false,
        read_by: []
      };

      await db.collection('chat_messages').doc(messageId).set(message);

      return {
        success: true,
        message: {
          ...message,
          created_at: new Date()
        }
      };

    } catch (error) {
      console.error('Firebase send message error:', error);
      throw error;
    }
  }

  async getMessages(projectId, limit = 50) {
    try {
      const messagesSnapshot = await db.collection('chat_messages')
        .where('project_id', '==', projectId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();

      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // Return in chronological order

      return {
        success: true,
        messages
      };

    } catch (error) {
      console.error('Firebase get messages error:', error);
      throw error;
    }
  }

  async subscribeToMessages(projectId, callback) {
    try {
      const unsubscribe = db.collection('chat_messages')
        .where('project_id', '==', projectId)
        .orderBy('created_at', 'desc')
        .limit(1)
        .onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const message = {
                id: change.doc.id,
                ...change.doc.data()
              };
              callback(message);
            }
          });
        });

      return unsubscribe;

    } catch (error) {
      console.error('Firebase subscription error:', error);
      throw error;
    }
  }

  async unsubscribeFromMessages(unsubscribe) {
    try {
      if (unsubscribe) {
        unsubscribe();
      }
    } catch (error) {
      console.error('Firebase unsubscribe error:', error);
    }
  }
}

// Local development provider (in-memory)
class LocalDevChatService extends ChatService {
  constructor() {
    super();
    this.messages = new Map(); // projectId -> messages array
    this.subscriptions = new Map(); // projectId -> callbacks array
  }

  async sendMessage(projectId, senderId, text, fileUrl = null) {
    try {
      const messageId = uuidv4();
      const message = {
        id: messageId,
        project_id: projectId,
        sender_id: senderId,
        text,
        file_url: fileUrl,
        created_at: new Date(),
        is_read: false,
        read_by: []
      };

      // Store in memory
      if (!this.messages.has(projectId)) {
        this.messages.set(projectId, []);
      }
      this.messages.get(projectId).push(message);

      // Notify subscribers
      const callbacks = this.subscriptions.get(projectId) || [];
      callbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('LocalDev callback error:', error);
        }
      });

      return {
        success: true,
        message
      };

    } catch (error) {
      console.error('LocalDev send message error:', error);
      throw error;
    }
  }

  async getMessages(projectId, limit = 50) {
    try {
      const projectMessages = this.messages.get(projectId) || [];
      const messages = projectMessages
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .slice(-limit);

      return {
        success: true,
        messages
      };

    } catch (error) {
      console.error('LocalDev get messages error:', error);
      throw error;
    }
  }

  async subscribeToMessages(projectId, callback) {
    try {
      if (!this.subscriptions.has(projectId)) {
        this.subscriptions.set(projectId, []);
      }
      this.subscriptions.get(projectId).push(callback);

      return { projectId, callback };

    } catch (error) {
      console.error('LocalDev subscription error:', error);
      throw error;
    }
  }

  async unsubscribeFromMessages(subscription) {
    try {
      if (subscription && subscription.projectId) {
        const callbacks = this.subscriptions.get(subscription.projectId) || [];
        const index = callbacks.indexOf(subscription.callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } catch (error) {
      console.error('LocalDev unsubscribe error:', error);
    }
  }
}

// Factory function to create appropriate ChatService
function createChatService() {
  const provider = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? 'supabase' :
                   process.env.FIREBASE_DATABASE_URL ? 'firebase' : 'localdev';

  console.log(`ChatService: Using ${provider} provider`);

  switch (provider) {
    case 'supabase':
      return new SupabaseChatService();
    case 'firebase':
      return new FirebaseChatService();
    case 'localdev':
    default:
      return new LocalDevChatService();
  }
}

// Export singleton instance
const chatService = createChatService();

module.exports = {
  ChatService,
  SupabaseChatService,
  FirebaseChatService,
  LocalDevChatService,
  createChatService,
  chatService
};

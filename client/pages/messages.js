// Messages Page for GigCampus
// Real-time messaging and communication hub

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ClockIcon,
  CheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../lib/api';
import { formatDate, getRelativeTime, getInitials } from '../lib/utils';

const MessagesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const { user: queryUser } = router.query;
  
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery(
    'conversations',
    chatAPI.getConversations,
    {
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery(
    ['messages', selectedConversation?.id],
    () => chatAPI.getMessages(selectedConversation.id),
    {
      enabled: !!selectedConversation?.id,
      refetchInterval: 5000 // Refetch every 5 seconds for real-time feel
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    ({ conversationId, text }) => chatAPI.sendMessage(conversationId, text),
    {
      onSuccess: () => {
        setMessage('');
        queryClient.invalidateQueries(['messages', selectedConversation?.id]);
        queryClient.invalidateQueries('conversations');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to send message');
      }
    }
  );

  // Create conversation mutation
  const createConversationMutation = useMutation(
    (participantId) => chatAPI.createConversation(participantId),
    {
      onSuccess: (data) => {
        const newConversation = data.data;
        setSelectedConversation(newConversation);
        queryClient.invalidateQueries('conversations');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create conversation');
      }
    }
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle starting conversation with specific user from query params
  useEffect(() => {
    if (queryUser && conversations?.data) {
      // Check if conversation already exists
      const existingConversation = conversations.data.find(conv => 
        conv.participants.some(p => p.id === queryUser)
      );
      
      if (existingConversation) {
        setSelectedConversation(existingConversation);
      } else {
        // Create new conversation
        createConversationMutation.mutate(queryUser);
      }
    }
  }, [queryUser, conversations]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      text: message.trim()
    });
  };

  const filteredConversations = conversations?.data?.filter(conversation => {
    if (!searchQuery.trim()) return true;
    
    const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <Layout>
      <div className="h-screen bg-white flex">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2" />
              Messages
            </h1>
            
            {/* Search */}
            <div className="mt-4 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredConversations.map((conversation) => {
                  const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
                  const isSelected = selectedConversation?.id === conversation.id;
                  
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full text-left p-4 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                        isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-full bg-gray-400 flex items-center justify-center text-white font-medium flex-shrink-0">
                          {getInitials(otherParticipant?.name)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {otherParticipant?.name}
                            </p>
                            {conversation.last_message_at && (
                              <p className="text-xs text-gray-500">
                                {getRelativeTime(conversation.last_message_at)}
                              </p>
                            )}
                          </div>
                          
                          {conversation.last_message && (
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {conversation.last_message_sender_id === user?.id && 'You: '}
                              {conversation.last_message}
                            </p>
                          )}
                          
                          {/* Unread indicator */}
                          {conversation.unread_count > 0 && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {conversation.unread_count} unread
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
                <p className="mt-1 text-sm text-gray-500 text-center">
                  Start messaging other users by visiting their profiles
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-medium">
                    {getInitials(
                      selectedConversation.participants.find(p => p.id !== user?.id)?.name
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.participants.find(p => p.id !== user?.id)?.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.participants.find(p => p.id !== user?.id)?.university}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : messages?.data && messages.data.length > 0 ? (
                  <>
                    {messages.data.map((msg, index) => {
                      const isOwn = msg.sender_id === user?.id;
                      const isLastInGroup = index === messages.data.length - 1 || 
                        messages.data[index + 1]?.sender_id !== msg.sender_id;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwn
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{msg.text}</p>
                            {isLastInGroup && (
                              <div className={`flex items-center justify-end mt-1 space-x-1 ${
                                isOwn ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                <span className="text-xs">
                                  {formatDate(msg.created_at, { includeTime: true })}
                                </span>
                                {isOwn && (
                                  <CheckIcon className="h-3 w-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Send a message to start the conversation</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex space-x-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sendMessageMutation.isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || sendMessageMutation.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendMessageMutation.isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* No Conversation Selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Select a conversation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MessagesPage;
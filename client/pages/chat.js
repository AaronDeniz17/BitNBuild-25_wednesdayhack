import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../lib/api';
import {
  PaperAirplaneIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

export default function Chat() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery(
    ['conversations'],
    () => chatAPI.getConversations(),
    {
      enabled: !!user,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery(
    ['messages', selectedConversation?.id],
    () => chatAPI.getMessages(selectedConversation.id),
    {
      enabled: !!selectedConversation,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    ({ conversationId, text }) => chatAPI.sendMessage(conversationId, text),
    {
      onSuccess: () => {
        setMessage('');
        queryClient.invalidateQueries(['messages', selectedConversation?.id]);
        queryClient.invalidateQueries(['conversations']);
      },
      onError: (error) => {
        alert('Failed to send message: ' + error.message);
      },
      onSettled: () => {
        setIsSending(false);
      }
    }
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations?.data && conversations.data.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations.data[0]);
    }
  }, [conversations, selectedConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      text: message.trim()
    });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation.participants) return null;
    return conversation.participants.find(p => p.id !== user?.id);
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
            <p className="text-gray-600 mb-4">You need to be logged in to access chat.</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-screen flex bg-white">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2" />
              Messages
            </h1>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : conversations && conversations.data && conversations.data.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {conversations.data.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {otherParticipant?.name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatMessageTime(conversation.lastMessage?.createdAt || conversation.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage?.text || 'Start a conversation...'}
                          </p>
                          {conversation.projectTitle && (
                            <p className="text-xs text-blue-600 truncate mt-1">
                              Project: {conversation.projectTitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mb-2" />
                <p>No conversations yet</p>
                <p className="text-sm">Start bidding on projects to begin chatting!</p>
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
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">
                        {getOtherParticipant(selectedConversation)?.name || 'Unknown User'}
                      </h2>
                      {selectedConversation.projectTitle && (
                        <p className="text-sm text-gray-600">
                          Project: {selectedConversation.projectTitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : messages && messages.data && messages.data.length > 0 ? (
                  messages.data.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.senderId === user.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.senderId === user.id ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || isSending}
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
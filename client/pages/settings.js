// Settings Page for GigCampus
// User account settings, notifications, and preferences

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  UserIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../lib/api';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    project_updates: true,
    bid_notifications: true,
    message_notifications: true,
    marketing_emails: false
  });
  
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Fetch current settings
  const { data: settings } = useQuery(
    'user-settings',
    authAPI.getSettings,
    {
      onSuccess: (data) => {
        if (data?.data) {
          setNotificationSettings(prev => ({
            ...prev,
            ...data.data
          }));
        }
      }
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (updates) => authAPI.updateProfile(updates),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        queryClient.invalidateQueries(['profile', user?.id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      }
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    (passwordInfo) => authAPI.changePassword(passwordInfo),
    {
      onSuccess: () => {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to change password');
      }
    }
  );

  // Update notifications mutation
  const updateNotificationsMutation = useMutation(
    (settings) => authAPI.updateNotificationSettings(settings),
    {
      onSuccess: () => {
        toast.success('Notification settings updated!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update settings');
      }
    }
  );

  // Delete account mutation
  const deleteAccountMutation = useMutation(
    () => authAPI.deleteAccount(),
    {
      onSuccess: () => {
        toast.success('Account deleted successfully');
        logout();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete account');
      }
    }
  );

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const handleUpdateNotifications = () => {
    updateNotificationsMutation.mutate(notificationSettings);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm account deletion');
      return;
    }
    
    deleteAccountMutation.mutate();
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    { id: 'danger', name: 'Danger Zone', icon: ExclamationTriangleIcon }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CogIcon className="h-8 w-8 mr-3" />
              Settings
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {activeTab === 'profile' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h2>
                    
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <EnvelopeIcon className="absolute left-3 top-2 h-5 w-5 text-gray-400" />
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Email cannot be changed as it's linked to your university verification
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          rows={4}
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell others about yourself..."
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h2>
                    
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={changePasswordMutation.isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h2>
                    
                    <div className="space-y-6">
                      {[
                        {
                          key: 'email_notifications',
                          title: 'Email Notifications',
                          description: 'Receive important updates via email'
                        },
                        {
                          key: 'project_updates',
                          title: 'Project Updates',
                          description: 'Get notified when projects you are involved in have updates'
                        },
                        {
                          key: 'bid_notifications',
                          title: 'Bid Notifications',
                          description: 'Receive notifications when someone bids on your projects'
                        },
                        {
                          key: 'message_notifications',
                          title: 'Message Notifications',
                          description: 'Get notified when you receive new messages'
                        },
                        {
                          key: 'marketing_emails',
                          title: 'Marketing Emails',
                          description: 'Receive promotional content and platform updates'
                        }
                      ].map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">{setting.title}</h3>
                            <p className="text-sm text-gray-500">{setting.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNotificationSettings(prev => ({
                              ...prev,
                              [setting.key]: !prev[setting.key]
                            }))}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              notificationSettings[setting.key] ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                notificationSettings[setting.key] ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        onClick={handleUpdateNotifications}
                        disabled={updateNotificationsMutation.isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {updateNotificationsMutation.isLoading ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Billing & Payments</h2>
                    
                    <div className="text-center py-12">
                      <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Payment Settings</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Payment integration coming soon. You'll be able to manage your payment methods and billing history here.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'danger' && (
                <div className="bg-white shadow rounded-lg border-red-200">
                  <div className="px-6 py-6">
                    <h2 className="text-lg font-medium text-red-900 mb-6 flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                      Danger Zone
                    </h2>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <h3 className="text-sm font-medium text-red-900 mb-2">Delete Account</h3>
                      <p className="text-sm text-red-700 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                        All your projects, messages, and data will be permanently deleted.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-2">
                            Type "DELETE" to confirm:
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="DELETE"
                          />
                        </div>
                        
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteAccountMutation.isLoading || deleteConfirmation !== 'DELETE'}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {deleteAccountMutation.isLoading ? 'Deleting...' : 'Delete My Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
// Header component for GigCampus
// Navigation header with user menu and notifications

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  BellIcon, 
  UserCircleIcon, 
  CogIcon, 
  ArrowRightOnRectangleIcon as LogoutIcon,
  Bars3Icon as MenuIcon,
  XMarkIcon as XIcon,
  HomeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

import { useAuth } from '../../contexts/AuthContext';
import { getUserDisplayName, getUserRoleDisplay } from '../../lib/auth';
import ThemeToggle from '../UI/ThemeToggle';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const navigation = [
    { 
      name: 'Home', 
      href: isAuthenticated ? (user?.role === 'student' ? '/student/dashboard' : '/client/dashboard') : '/', 
      icon: HomeIcon 
    },
    { name: 'Projects', href: '/projects', icon: BriefcaseIcon },
    { name: 'Teams', href: '/teams', icon: UserGroupIcon },
    { name: 'Leaderboard', href: '/leaderboard', icon: ChartBarIcon },
  ];

  const userNavigation = [
    { name: 'Profile', href: '/profile' },
    { name: 'Settings', href: '/settings' },
    { name: 'Help', href: '/help' },
  ];

  if (!isAuthenticated) {
    return (
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white font-bold text-lg">G</span>
                  </div>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">GigCampus</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login" className="btn-secondary">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span className="text-white font-bold text-lg">G</span>
                </div>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">GigCampus</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-1" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 relative transition-colors duration-200 hover:scale-110 active:scale-95">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800 animate-pulse"></span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="ml-2 text-gray-700 dark:text-gray-300 font-medium hidden sm:block transition-colors duration-300">
                  {getUserDisplayName(user)}
                </span>
              </button>

              {/* User dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 animate-fade-in-up border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getUserRoleDisplay(user?.role)}
                    </p>
                  </div>
                  
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <LogoutIcon className="h-4 w-4 inline mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-all duration-200 hover:scale-110 active:scale-95"
            >
              {isMenuOpen ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden animate-slide-down">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 inline mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

// Authentication context for GigCampus
// Provides authentication state and methods throughout the app

import { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

import { authAPI, handleAPIError } from '../lib/api';
import { getStoredAuth, storeAuth, clearAuth, getDefaultRedirect } from '../lib/auth';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAuth = getStoredAuth();
        
        if (storedAuth && storedAuth.token && storedAuth.user) {
          // Verify token is still valid by fetching profile
          try {
            const response = await authAPI.getProfile();
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: response.data.user,
                token: storedAuth.token,
              },
            });
          } catch (error) {
            // Token is invalid, clear stored auth
            clearAuth();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuth();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await authAPI.login(email, password);
      const { user, token } = response.data;

      // Store auth data
      storeAuth({ user, token });

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorData = handleAPIError(error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorData.message,
      });
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await authAPI.register(userData);
      const { user, token } = response.data;

      // Store auth data
      storeAuth({ user, token });

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const errorData = handleAPIError(error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorData.message,
      });
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logged out successfully');
      router.push('/login');
    }
  };

  // Update user profile
  const updateUser = async (updates) => {
    try {
      const response = await authAPI.updateProfile(updates);
      const updatedUser = response.data.user;

      // Update stored auth
      const storedAuth = getStoredAuth();
      if (storedAuth) {
        storeAuth({ ...storedAuth, user: updatedUser });
      }

      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser,
      });

      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const errorData = handleAPIError(error);
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  // Verify university
  const verifyUniversity = async (university, studentId) => {
    try {
      const response = await authAPI.verifyUniversity(university, studentId);
      
      // Update user in state
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: { university_verified: true },
      });

      // Update stored auth
      const storedAuth = getStoredAuth();
      if (storedAuth) {
        storeAuth({
          ...storedAuth,
          user: { ...storedAuth.user, university_verified: true },
        });
      }

      toast.success('University verification successful!');
      return { success: true };
    } catch (error) {
      const errorData = handleAPIError(error);
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Set loading
  const setLoading = (loading) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: loading });
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    verifyUniversity,
    clearError,
    setLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

// Authentication context for GigCampus
// Provides authentication state and methods throughout the app

import { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

import { auth as firebaseAuth } from '../lib/firebase';
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
          // Trust stored auth for now (skip API verification)
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: storedAuth.user,
              token: storedAuth.token,
            },
          });
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

      // First, authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get the ID token
      const idToken = await firebaseUser.getIdToken();

      // Send the token to our backend for verification and user data
      const response = await authAPI.login(idToken);
      const { user } = response.data;

      // Store auth data with Firebase token
      storeAuth({ user, token: idToken });

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token: idToken },
      });

      toast.success('Login successful!');
      return { success: true, user };
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error.code) {
        // Firebase Auth error
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
          default:
            errorMessage = error.message;
        }
      } else {
        // API error
        const errorData = handleAPIError(error);
        errorMessage = errorData.message;
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // First, create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth, 
        userData.email, 
        userData.password
      );
      const firebaseUser = userCredential.user;
      
      // Get the ID token
      const idToken = await firebaseUser.getIdToken();

      // Send user data to our backend with the Firebase UID
      const registrationData = {
        ...userData,
        uid: firebaseUser.uid,
        idToken
      };

      const response = await authAPI.register(registrationData);
      const { user } = response.data;

      // Store auth data
      storeAuth({ user, token: idToken });

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token: idToken },
      });

      toast.success('Registration successful!');
      return { success: true, user };
    } catch (error) {
      let errorMessage = 'Registration failed';
      
      if (error.code) {
        // Firebase Auth error
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak';
            break;
          default:
            errorMessage = error.message;
        }
      } else {
        // API error
        const errorData = handleAPIError(error);
        errorMessage = errorData.message;
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Sign out from Firebase Auth
      await signOut(firebaseAuth);
      // Optionally call backend logout (if needed for cleanup)
      try {
        await authAPI.logout();
      } catch (error) {
        // Backend logout error is not critical
        console.warn('Backend logout error:', error);
      }
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

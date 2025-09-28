import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import { UserRole, UserProfile } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      // Check students collection first
      const studentDoc = await getDoc(doc(db, 'students', uid));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        return { 
          ...data, 
          uid,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as UserProfile;
      }

      // Check clients collection
      const clientDoc = await getDoc(doc(db, 'clients', uid));
      if (clientDoc.exists()) {
        const data = clientDoc.data();
        return { 
          ...data, 
          uid,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as UserProfile;
      }

      // Check admins collection
      const adminDoc = await getDoc(doc(db, 'admins', uid));
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        return { 
          ...data, 
          uid,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as UserProfile;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      
      // Create initial profile based on role
      const baseProfile = {
        uid: result.user.uid,
        name,
        email,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnboarded: false,
      };

      let collection = '';
      let profile: any = baseProfile;

      switch (role) {
        case 'student':
          collection = 'students';
          profile = {
            ...baseProfile,
            skills: [],
            portfolioLinks: {},
            availability: 0,
            hourlyRate: 0,
            bio: '',
            badges: [],
          };
          break;
        case 'client':
          collection = 'clients';
          profile = {
            ...baseProfile,
            companyName: '',
            kycVerified: false,
          };
          break;
        case 'admin':
          collection = 'admins';
          profile = {
            ...baseProfile,
            permissions: [],
            isOnboarded: true, // Admins don't need onboarding
          };
          break;
      }

      await setDoc(doc(db, collection, result.user.uid), profile);

      // Initialize wallet for students and clients
      if (role === 'student' || role === 'client') {
        await setDoc(doc(db, 'wallets', result.user.uid), {
          uid: result.user.uid,
          balance: 0,
          pendingBalance: 0,
          transactions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Immediately update the userProfile state
      setUserProfile(profile);

      toast({
        title: "Account created!",
        description: "Welcome to GigCampus!",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
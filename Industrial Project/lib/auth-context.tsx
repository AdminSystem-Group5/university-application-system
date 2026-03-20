/**
 * Authentication Context Provider
 * Role 3 - Backend & Database Lead (Firebase Architect)
 * 
 * This module provides authentication state management using Firebase Auth.
 * It implements the Context pattern for React, enabling components throughout
 * the application to access the current user's authentication state.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { getUserById, createUser } from './firestore-utils';
import type { User, UserRole } from '@/types/database';

// ============================================
// AUTH CONTEXT TYPES
// ============================================

interface AuthState {
  firebaseUser: FirebaseUser | null;
  userData: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  // Authentication methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  
  // User data methods
  refreshUserData: () => Promise<void>;
  
  // Role checks
  isStudent: boolean;
  isUniversityAdmin: boolean;
}

// ============================================
// CONTEXT CREATION
// ============================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================
// AUTH PROVIDER COMPONENT
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    userData: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Fetch user data from Firestore
  const fetchUserData = useCallback(async (uid: string): Promise<User | null> => {
    try {
      return await getUserById(uid);
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const auth = getFirebaseAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const userData = await fetchUserData(firebaseUser.uid);
        
        setState({
          firebaseUser,
          userData,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        // User is signed out
        setState({
          firebaseUser: null,
          userData: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const auth = getFirebaseAuth();
      
      // Create Firebase Auth user
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(firebaseUser, { displayName });
      
      // Create Firestore user document
      await createUser({
        uid: firebaseUser.uid,
        email: email,
        role: role,
        displayName: displayName,
        profileData: {
          privacyPolicyAccepted: false,
        },
      });
      
      // Send verification email
      await sendEmailVerification(firebaseUser);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  // Send verification email
  const sendVerificationEmail = async (): Promise<void> => {
    if (!state.firebaseUser) {
      throw new Error('No user signed in');
    }
    
    try {
      await sendEmailVerification(state.firebaseUser);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification email';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  // Refresh user data from Firestore
  const refreshUserData = async (): Promise<void> => {
    if (!state.firebaseUser) return;
    
    const userData = await fetchUserData(state.firebaseUser.uid);
    setState(prev => ({ ...prev, userData }));
  };

  // Compute role booleans
  const isStudent = state.userData?.role === 'student';
  const isUniversityAdmin = state.userData?.role === 'university_admin';

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendVerificationEmail,
    refreshUserData,
    isStudent,
    isUniversityAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// CUSTOM HOOK
// ============================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ============================================
// PROTECTED ROUTE WRAPPER
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallback = null 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, userData } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requiredRole && userData?.role !== requiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// HOOK FOR ROLE-BASED ACCESS
// ============================================

export function useRequireAuth(requiredRole?: UserRole): {
  isAuthorized: boolean;
  isLoading: boolean;
} {
  const { isAuthenticated, isLoading, userData } = useAuth();

  if (isLoading) {
    return { isAuthorized: false, isLoading: true };
  }

  if (!isAuthenticated) {
    return { isAuthorized: false, isLoading: false };
  }

  if (requiredRole && userData?.role !== requiredRole) {
    return { isAuthorized: false, isLoading: false };
  }

  return { isAuthorized: true, isLoading: false };
}

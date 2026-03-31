"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";
import { getUserById, createUser } from "./firestore-utils";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    firebaseUser: null,
    userData: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const fetchUserData = useCallback(async (uid) => {
    try {
      return await getUserById(uid);
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser.uid);

        setState({
          firebaseUser,
          userData,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
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

  const signIn = async (email, password) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign in failed";
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  };

  const signUp = async (email, password, displayName, role) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const auth = getFirebaseAuth();

      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(firebaseUser, { displayName });

      await createUser({
        uid: firebaseUser.uid,
        email,
        role,
        displayName,
        profileData: {
          privacyPolicyAccepted: false,
        },
      });

      await sendEmailVerification(firebaseUser);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign up failed";
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign out failed";
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Password reset failed";
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (!state.firebaseUser) {
      throw new Error("No user signed in");
    }

    try {
      await sendEmailVerification(state.firebaseUser);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send verification email";
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  const refreshUserData = async () => {
    if (!state.firebaseUser) return;

    const userData = await fetchUserData(state.firebaseUser.uid);
    setState((prev) => ({ ...prev, userData }));
  };

  const isStudent = state.userData?.role === "student";
  const isUniversityAdmin = state.userData?.role === "university_admin";

  const value = {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback = null,
}) {
  const { isAuthenticated, isLoading, userData } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
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

export function useRequireAuth(requiredRole) {
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
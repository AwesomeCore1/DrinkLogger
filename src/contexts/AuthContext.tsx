'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { auth } from '@/firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  adminLoading: boolean;
  refreshClaims: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Prefer Local persistence so mobile browsers keep the session.
    // If Local isn't available (some privacy modes), fall back to Session.
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        try {
          await setPersistence(auth, browserSessionPersistence);
        } catch {
          // Ignore; Firebase will use its default.
        }
      }

      // If a Google Redirect flow happened, this resolves it.
      // Safe to call even if no redirect sign-in occurred.
      try {
        await getRedirectResult(auth);
      } catch {
        // Ignore redirect result errors; auth state will still come through onAuthStateChanged.
      }
    })();

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (cancelled) return;

      setUser(nextUser);
      setLoading(false);

      if (!nextUser) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      setAdminLoading(true);
      nextUser
        .getIdTokenResult()
        .then((token) => {
          if (cancelled) return;
          setIsAdmin(token?.claims?.admin === true);
        })
        .catch(() => {
          if (cancelled) return;
          setIsAdmin(false);
        })
        .finally(() => {
          if (cancelled) return;
          setAdminLoading(false);
        });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const refreshClaims = async () => {
    const current = auth.currentUser;
    if (!current) {
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }

    setAdminLoading(true);
    try {
      const token = await current.getIdTokenResult(true);
      setIsAdmin(token?.claims?.admin === true);
    } catch {
      setIsAdmin(false);
    } finally {
      setAdminLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Ensure persistence is set before sign-in attempts.
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        // Non-fatal
      }
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // Re-throw the error so the calling component can handle it
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // Popups are often blocked on mobile Safari/Chrome. Try popup first, then fall back.
    try {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        // Non-fatal
      }
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const code = error?.code as string | undefined;
      const likelyPopupBlocked =
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request';

      if (likelyPopupBlocked) {
        await signInWithRedirect(auth, provider);
        return;
      }

      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, adminLoading, refreshClaims, signIn, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  getIdToken,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../services/firebase';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);

  // This flag prevents onAuthStateChanged from firing a premature sync during
  // registration — before updateProfile has set the displayName.
  const isRegistering = useRef(false);

  const syncUserWithBackend = useCallback(async (firebaseUser) => {
    try {
      console.log('[AuthSync] ─── Sync Start ───');
      console.log('[AuthSync] Firebase User:', firebaseUser.email, '| UID:', firebaseUser.uid);

      // Force-refresh the token
      const token = await getIdToken(firebaseUser, true);
      localStorage.setItem('skillconnect_token', token);
      console.log('[AuthSync] ✅ Token refreshed.');
      
      const payload = {
        full_name: firebaseUser.displayName || auth.currentUser?.displayName || null,
        profile_image: firebaseUser.photoURL || null
      };

      // ⏱ 10-second safety timeout — if backend is down/slow, don't freeze the UI
      const syncPromise = api.post('/users/sync', payload);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Backend sync timeout after 10s')), 10000)
      );

      const response = await Promise.race([syncPromise, timeoutPromise]);
      const dbUser = response?.data;
      
      if (!dbUser) {
        console.error('[AuthSync] ❌ Sync succeeded but response.data is empty.');
      } else {
        console.log('[AuthSync] ✅ DB User synced. ID:', dbUser.id, '| Role:', dbUser.role);
      }

      const userData = { ...firebaseUser, dbUser: dbUser || null };
      setUser(userData);
      setIsRecovering(false);
      console.log('[AuthSync] ─── Sync Complete ───');
      return userData;
    } catch (err) {
      console.warn('[AuthSync] ⚠️ Sync failed or timed out — falling back to Firebase-only user:', err.message);

      // Gracefully continue with Firebase data so the UI never gets stuck
      const fallbackUser = { ...firebaseUser, dbUser: null };
      setUser(fallbackUser);
      setIsRecovering(false);
      return fallbackUser;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        if (isRegistering.current) {
          // Registration is in progress — skip auto-sync.
          // register() will handle it manually after updateProfile completes.
          console.log('[AuthStateChanged] Registration in progress — skipping auto-sync.');
          setLoading(false);
          return;
        }
        // Normal login or session restore — sync with backend
        await syncUserWithBackend(firebaseUser);
      } else {
        localStorage.removeItem('skillconnect_token');
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [syncUserWithBackend]);

  const login = async (email, password) => {
    console.log('[AuthContext] Logging in:', email);
    // signInWithEmailAndPassword triggers onAuthStateChanged which handles the sync
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  };

  const register = async (email, password, name) => {
    console.log('[AuthContext] 🚀 Starting registration for:', email);
    
    // 🔑 CRITICAL: Block auto-sync BEFORE Firebase creates the account.
    // Without this, onAuthStateChanged fires instantly with displayName = null.
    isRegistering.current = true;
    
    try {
      // Step 1: Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Step 2: Set the display name — must happen before sync
      console.log('[AuthContext] Setting displayName to:', name);
      await updateProfile(userCredential.user, { displayName: name });
      console.log('[AuthContext] ✅ displayName confirmed:', auth.currentUser?.displayName);
      
      // Step 3: Send verification email
      console.log('[AuthContext] Sending verification email...');
      await sendEmailVerification(userCredential.user);
      
      // Step 4: Sync with backend — displayName is now guaranteed to be set
      console.log('[AuthContext] Triggering backend sync...');
      const syncedUser = await syncUserWithBackend(auth.currentUser);
      
      console.log('[AuthContext] ✅ Registration & Sync Complete. dbUser ID:', syncedUser?.dbUser?.id);
      return userCredential;
    } finally {
      // 🔑 CRITICAL: Always clear the flag so login/session restore works normally afterwards
      isRegistering.current = false;
      console.log('[AuthContext] isRegistering flag cleared.');
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      console.log('[AuthContext] Verification email resent.');
    }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('skillconnect_token');
    setUser(null);
  };

  const checkEmailVerification = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setUser(prev => ({
        ...prev,
        emailVerified: updatedUser.emailVerified
      }));
      return updatedUser.emailVerified;
    }
    return false;
  };

  const value = {
    user,
    login,
    register,
    resendVerification,
    checkEmailVerification,
    logout,
    loading,
    isRecovering,
    refreshUser: () => auth.currentUser && syncUserWithBackend(auth.currentUser)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

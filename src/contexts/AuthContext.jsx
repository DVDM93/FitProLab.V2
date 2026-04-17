import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'member'
  const [userData, setUserData] = useState(null); // Full Firestore user document
  const [loading, setLoading] = useState(true);

  async function signup(email, password, name, role = 'member') {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const newUserData = {
      name,
      email,
      role,
      plan: 'Basic',
      joinDate: new Date().toISOString(),
      status: 'Attivo',
    };

    await setDoc(doc(db, 'users', user.uid), newUserData);

    setUserRole(role);
    setUserData(newUserData);
    return user;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserData(null);
    setUserRole(null);
    return signOut(auth);
  }

  // Can be called after profile updates to refresh userData in context
  const refreshUserData = useCallback(async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({ id: userDoc.id, ...data });
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({ id: userDoc.id, ...data });
            setUserRole(data.role);
          } else {
            // Fallback for users without a Firestore document
            setUserData({ id: user.uid, email: user.email, role: 'member' });
            setUserRole('member');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserRole('member');
        }
      } else {
        setUserData(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userData,       // Full user profile (name, plan, status, phone, ecc.)
    refreshUserData,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

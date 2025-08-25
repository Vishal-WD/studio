'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db, getFCMToken } from '@/lib/firebase';
import { useToast } from './use-toast';

interface UserData {
  username?: string;
  role?: 'student' | 'faculty' | 'admin';
  fcmTokens?: string[];
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        } else {
          setUserData(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        setUserData(null);
        setLoading(false);
      });
      
      // Request permission for notifications and get token
      const requestNotificationPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const token = await getFCMToken();
            if (token) {
              const userDoc = await getDoc(userDocRef);
              const currentTokens = userDoc.data()?.fcmTokens || [];
              if (!currentTokens.includes(token)) {
                 await updateDoc(userDocRef, {
                    fcmTokens: arrayUnion(token)
                 });
              }
            }
          } else {
            console.log('Notification permission denied.');
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          toast({ variant: 'destructive', title: 'Notifications Error', description: 'Could not enable notifications.' });
        }
      }

      requestNotificationPermission();

      return () => unsubscribeSnapshot();
    }
  }, [user, toast]);

  const value = { user, userData, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
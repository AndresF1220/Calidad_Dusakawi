
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase/provider';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type UserRole = 'superadmin' | 'admin' | 'viewer';

interface UserProfile {
  role: UserRole;
  // other profile fields can be added here
}

export function useAuth() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (isUserLoading || !firestore) {
        return;
      }
      
      if (!user) {
        setUserRole(null);
        setIsRoleLoading(false);
        return;
      }

      setIsRoleLoading(true);
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userProfile = userSnap.data() as UserProfile;
        setUserRole(userProfile.role);
      } else {
        // User document doesn't exist, create one with a default role
        try {
          const defaultProfile: UserProfile = { role: 'viewer' };
          await setDoc(userRef, defaultProfile);
          setUserRole(defaultProfile.role);
        } catch (error) {
          console.error("Failed to create user profile:", error);
          setUserRole(null); // Set to null on error
        }
      }
      setIsRoleLoading(false);
    }

    fetchUserRole();
  }, [user, isUserLoading, firestore]);

  return { 
    user, 
    userRole, 
    isLoading: isUserLoading || isRoleLoading 
  };
}

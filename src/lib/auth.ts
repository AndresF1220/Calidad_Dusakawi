
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
  const [userRole, setUserRole] = useState<UserRole | null>('superadmin'); // Default to superadmin
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (isUserLoading || !firestore) {
        // While loading, we can keep the default superadmin to avoid UI flicker
        return;
      }
      
      if (!user) {
        // No user, default to superadmin for development
        setUserRole('superadmin');
        setIsRoleLoading(false);
        return;
      }

      setIsRoleLoading(true);
      const userRef = doc(firestore, 'users', user.uid);
      
      try {
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userProfile = userSnap.data() as UserProfile;
          setUserRole(userProfile.role || 'superadmin'); // Default to superadmin if role field is missing
        } else {
          // For development, if user profile doesn't exist, treat as superadmin
           setUserRole('superadmin');
        }
      } catch (error) {
        console.error("Failed to fetch user role, defaulting to superadmin:", error);
        setUserRole('superadmin'); // Default to superadmin on error
      } finally {
        setIsRoleLoading(false);
      }
    }

    fetchUserRole();
  }, [user, isUserLoading, firestore]);

  return { 
    user, 
    userRole, 
    isLoading: isUserLoading || isRoleLoading 
  };
}

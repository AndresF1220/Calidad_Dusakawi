
'use client';

import { useUser } from '@/firebase/provider';

type UserRole = 'superadmin' | 'admin' | 'viewer';

/**
 * A simplified hook for development that always returns 'superadmin' role.
 * This ensures all UI controls are visible without needing a user session or Firestore document.
 */
export function useAuth() {
  const { user, isUserLoading } = useUser();

  // For development purposes, always return 'superadmin' to ensure all UI is accessible.
  // The original logic for fetching roles from Firestore can be restored later.
  return { 
    user, 
    userRole: 'superadmin' as UserRole, 
    isLoading: isUserLoading 
  };
}

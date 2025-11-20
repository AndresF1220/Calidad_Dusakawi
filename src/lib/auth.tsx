
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export type UserRole = 'superadmin' | 'admin' | 'viewer';
export type UserStatus = 'active' | 'inactive';

interface UserProfile {
    role: UserRole;
    status: UserStatus;
}

interface AuthContextType {
    user: User | null;
    userRole: UserRole | null;
    isRoleLoading: boolean;
    isActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { user, firestore, isUserLoading } = useFirebase();
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [isActive, setIsActive] = useState<boolean>(false);
    const [isRoleLoading, setIsRoleLoading] = useState<boolean>(true);

    const userDocRef = useMemoFirebase(
      () => (user?.uid && firestore) ? doc(firestore, 'users', user.uid) : null,
      [user, firestore]
    );

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    useEffect(() => {
        // Determine if we are still in a loading state.
        // We are loading if the user auth state is loading, OR if we have a user but their profile hasn't loaded yet.
        const isLoading = isUserLoading || (user != null && isProfileLoading);
        setIsRoleLoading(isLoading);
        
        if (isLoading) {
            // While loading, ensure default non-privileged state.
            setUserRole(null);
            setIsActive(false);
            return;
        }

        // Once loading is complete, determine the role and status.
        if (user && userProfile) {
            setUserRole(userProfile.role);
            setIsActive(userProfile.status === 'active');
        } else {
            // If there's no user or no profile, they have no role and are not active.
            setUserRole(null);
            setIsActive(false);
        }
    }, [user, userProfile, isUserLoading, isProfileLoading]);
    
    const authInfo: AuthContextType = {
        user,
        userRole,
        isRoleLoading,
        isActive,
    };

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

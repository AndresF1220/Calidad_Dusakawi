
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
    const { user, firestore, isUserLoading: isAuthLoading } = useFirebase();
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [isActive, setIsActive] = useState<boolean>(false);
    const [isRoleLoading, setIsRoleLoading] = useState<boolean>(true);

    const userDocRef = useMemoFirebase(
      () => (user?.uid && firestore) ? doc(firestore, 'users', user.uid) : null,
      [user, firestore]
    );

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    useEffect(() => {
        // We are loading if the Firebase Auth user is still loading, OR
        // if we have a user but we are still waiting for their profile from Firestore.
        const isLoading = isAuthLoading || (!!user && isProfileLoading);
        setIsRoleLoading(isLoading);

        if (isLoading) {
            // While loading, maintain a non-privileged, inactive state.
            setUserRole(null);
            setIsActive(false);
            return;
        }

        // Once all loading is complete, we can make a final determination.
        if (user && userProfile) {
            // We have a user and their profile data. Set role and active status.
            setUserRole(userProfile.role);
            setIsActive(userProfile.status === 'active');
        } else {
            // No user or no profile found after loading is complete.
            setUserRole(null);
            setIsActive(false);
        }
    }, [user, userProfile, isAuthLoading, isProfileLoading]);
    
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

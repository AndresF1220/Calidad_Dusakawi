
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export type UserRole = 'superadmin' | 'admin' | 'viewer';
export type UserStatus = 'active' | 'inactive';

interface UserProfile {
    role: UserRole;
    status: UserStatus;
}

interface AuthContextType {
    user: ReturnType<typeof useFirebase>['user'];
    userRole: UserRole | null;
    isRoleLoading: boolean;
    isActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { user, firestore, isUserLoading } = useFirebase();
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [isRoleLoading, setIsRoleLoading] = useState(true);

    const userDocRef = useMemoFirebase(
      () => (user?.uid && firestore) ? doc(firestore, 'users', user.uid) : null,
      [user, firestore]
    );

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    useEffect(() => {
        const totalLoading = isUserLoading || isProfileLoading;
        setIsRoleLoading(totalLoading);

        if (!totalLoading) {
            if (userProfile) {
                setUserRole(userProfile.role);
                setIsActive(userProfile.status === 'active');
            } else {
                // User is authenticated but has no profile, or is not logged in at all.
                // In either case, they are not considered 'active'.
                setUserRole(null);
                setIsActive(false);
            }
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

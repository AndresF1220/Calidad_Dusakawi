
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type UserRole = 'superadmin' | 'admin' | 'viewer';

interface UserProfile {
    role: UserRole;
}

interface AuthContextType {
    user: ReturnType<typeof useFirebase>['user'];
    userRole: UserRole | null;
    isRoleLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { user, firestore, isUserLoading } = useFirebase();
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [isRoleLoading, setIsRoleLoading] = useState(true);

    const userDocRef = useMemoFirebase(
      () => (user?.uid && firestore) ? doc(firestore, 'users', user.uid) : null,
      [user, firestore]
    );

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    useEffect(() => {
        setIsRoleLoading(isUserLoading || isProfileLoading);
        if (userProfile) {
            setUserRole(userProfile.role);
        } else if (!isUserLoading && !isProfileLoading) {
            // User exists but has no profile, or is not logged in
            setUserRole(null);
        }

    }, [user, userProfile, isUserLoading, isProfileLoading]);
    
    const authInfo: AuthContextType = {
        user,
        userRole,
        isRoleLoading,
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

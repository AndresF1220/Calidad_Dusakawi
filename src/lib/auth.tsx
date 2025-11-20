'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export type UserRole = 'superadmin' | 'admin' | 'viewer';
export type UserStatus = 'active' | 'inactive';

interface AuthContextType {
    user: User | null;
    userRole: UserRole | null;
    isRoleLoading: boolean;
    isActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { user: firebaseUser, firestore, isUserLoading: isAuthLoading } = useFirebase();
    
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [isActive, setIsActive] = useState<boolean>(false);
    const [isRoleLoading, setIsRoleLoading] = useState<boolean>(true);

    useEffect(() => {
        // If Firebase Auth is still loading, or there's no authenticated user,
        // we are in a loading or logged-out state.
        if (isAuthLoading || !firebaseUser) {
            setIsRoleLoading(isAuthLoading);
            setUserRole(null);
            setIsActive(false);
            return;
        }

        // We have a Firebase user, now fetch their profile from Firestore.
        setIsRoleLoading(true);
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);

        getDoc(userDocRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    const userProfile = docSnap.data();
                    setUserRole(userProfile.role || null);
                    setIsActive(userProfile.status === 'active');
                } else {
                    // User exists in Auth but not in Firestore DB. Treat as unauthorized.
                    console.warn(`User with UID ${firebaseUser.uid} not found in Firestore.`);
                    setUserRole(null);
                    setIsActive(false);
                }
            })
            .catch((error) => {
                console.error("Error fetching user profile:", error);
                setUserRole(null);
                setIsActive(false);
            })
            .finally(() => {
                // Finished loading the profile data.
                setIsRoleLoading(false);
            });

    }, [firebaseUser, isAuthLoading, firestore]);
    
    const authInfo: AuthContextType = {
        user: firebaseUser,
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

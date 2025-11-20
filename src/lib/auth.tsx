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
        // If Firebase Auth is loading, we wait.
        if (isAuthLoading) {
            setIsRoleLoading(true);
            return;
        }

        // If there is no authenticated user, session ends.
        if (!firebaseUser) {
            setUserRole(null);
            setIsActive(false);
            setIsRoleLoading(false);
            return;
        }

        // We have a user, now fetch their profile from Firestore.
        // This will run whenever the firebaseUser object changes (e.g., on login/logout).
        setIsRoleLoading(true);
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);

        getDoc(userDocRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    const userProfile = docSnap.data();
                    // Log to console for debugging, as requested.
                    console.log("Perfil Firestore:", userProfile);
                    setUserRole(userProfile.role || null);
                    // The core logic: set active state based on Firestore data.
                    setIsActive(userProfile.status === 'active');
                } else {
                    // User is in Auth, but no document in Firestore. Treat as unauthorized.
                    console.warn(`User with UID ${firebaseUser.uid} not found in Firestore. Access denied.`);
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
                // Profile loading is complete.
                setIsRoleLoading(false);
            });

    }, [firebaseUser, isAuthLoading, firestore]);
    
    const authInfo: AuthContextType = {
        user: firebaseUser,
        userRole,
        isRoleLoading: isRoleLoading,
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

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
        // Start loading whenever auth state changes.
        setIsRoleLoading(true);

        if (isAuthLoading) {
            // If Firebase Auth is still loading, we wait.
            return;
        }

        if (!firebaseUser) {
            // No user is logged in.
            setUserRole(null);
            setIsActive(false);
            setIsRoleLoading(false);
            return;
        }

        // We have a user from Firebase Auth, now fetch their profile from Firestore.
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);

        getDoc(userDocRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    const userProfile = docSnap.data();
                    console.log("Perfil Firestore:", userProfile); // Debugging log
                    
                    const role = userProfile.role || null;
                    const status = userProfile.status || 'inactive';

                    setUserRole(role);
                    setIsActive(status === 'active');
                } else {
                    // User exists in Auth but not in Firestore DB.
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
                // Profile fetching is complete.
                setIsRoleLoading(false);
            });

    }, [firebaseUser, isAuthLoading, firestore]);
    
    const authInfo: AuthContextType = {
        user: firebaseUser,
        userRole,
        isRoleLoading: isRoleLoading || isAuthLoading,
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

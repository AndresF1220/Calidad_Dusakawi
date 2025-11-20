
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
        // We start by assuming we are loading, until we have a definitive answer.
        setIsRoleLoading(true);

        // If Firebase Auth is still loading, we wait. The effect will re-run when it's done.
        if (isAuthLoading) {
            return;
        }

        // If Firebase Auth is done and there's no user, then the session is unauthenticated.
        if (!firebaseUser) {
            setUserRole(null);
            setIsActive(false);
            setIsRoleLoading(false); // Loading is complete, there is no user.
            return;
        }

        // If we have a firebaseUser, fetch their profile from Firestore.
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);

        getDoc(userDocRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    const userProfile = docSnap.data();
                    console.log("Perfil Firestore:", userProfile); // Debugging log
                    
                    const role = userProfile.role as UserRole | null;
                    const status = userProfile.status as UserStatus | 'inactive';

                    setUserRole(role);
                    setIsActive(status === 'active');
                } else {
                    // User exists in Auth but has no profile in Firestore.
                    console.warn(`User with UID ${firebaseUser.uid} not found in Firestore. Denying access.`);
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
                // Whether we found a profile or not, the role/status check is complete.
                setIsRoleLoading(false);
            });

    }, [firebaseUser, isAuthLoading, firestore]);
    
    const authInfo: AuthContextType = {
        user: firebaseUser,
        userRole,
        isRoleLoading, // This now accurately reflects the entire process
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

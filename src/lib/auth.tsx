
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';

export type UserRole = 'superadmin' | 'admin' | 'viewer';
export type UserStatus = 'active' | 'inactive';

export type UserProfile = {
    id: string;
    fullName: string;
    email: string;
    cedula: string;
    role: UserRole;
    status: UserStatus;
    tempPassword?: string;
    areaId: string;
    areaNombre: string;
    procesoId?: string | null;
    procesoNombre?: string | null;
    subprocesoId?: string | null;
    subprocesoNombre?: string | null;
};

interface AuthContextType {
    user: FirebaseUser | null;
    userProfile: UserProfile | null;
    userRole: UserRole | null;
    isRoleLoading: boolean;
    isActive: boolean;
    isLoggingOut: boolean;
    setIsLoggingOut?: Dispatch<SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { user: firebaseUser, firestore, isUserLoading: isAuthLoading } = useFirebase();
    
    const userDocRef = useMemoFirebase(
        () => (firestore && firebaseUser ? doc(firestore, 'users', firebaseUser.uid) : null),
        [firestore, firebaseUser]
    );

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

    useEffect(() => {
        if (!isAuthLoading && !firebaseUser) {
            setIsLoggingOut(false);
        }
    }, [isAuthLoading, firebaseUser]);
    
    const isRoleLoading = isAuthLoading || isProfileLoading;

    const authInfo: AuthContextType = {
        user: firebaseUser,
        userProfile: userProfile,
        userRole: userProfile?.role || null,
        isRoleLoading: isRoleLoading,
        isActive: userProfile?.status === 'active',
        isLoggingOut,
        setIsLoggingOut,
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

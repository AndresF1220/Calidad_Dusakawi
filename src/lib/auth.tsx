
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
        const fetchOrSetUserProfile = async () => {
            if (isAuthLoading) {
                setIsRoleLoading(true);
                return;
            }

            if (!firebaseUser) {
                setUserRole(null);
                setIsActive(false);
                setIsRoleLoading(false);
                return;
            }

            setIsRoleLoading(true);

            const userDocRef = doc(firestore, 'users', firebaseUser.uid);
            
            try {
                const docSnap = await getDoc(userDocRef);
                let userProfile;

                if (docSnap.exists()) {
                    userProfile = docSnap.data();
                } else {
                    console.warn(`User with UID ${firebaseUser.uid} not found in Firestore. Creating default profile.`);
                    
                    const defaultProfile = {
                        role: 'viewer' as UserRole,
                        status: 'active' as UserStatus,
                        fullName: firebaseUser.displayName || '',
                        cedula: '', // cedula is not available from auth, must be added later
                        email: firebaseUser.email || '',
                        tempPassword: '',
                        createdAt: serverTimestamp(),
                    };

                    await setDoc(userDocRef, defaultProfile);
                    userProfile = defaultProfile;
                    console.log(`Default profile created for UID ${firebaseUser.uid}`);
                }
                
                if (userProfile) {
                    const role = userProfile.role as UserRole | null;
                    const status = userProfile.status as UserStatus | 'inactive';
                    
                    setUserRole(role);
                    setIsActive(status === 'active');
                } else {
                     setUserRole(null);
                     setIsActive(false);
                }

            } catch (error) {
                console.error("Error fetching/creating user profile:", error);
                setUserRole(null);
                setIsActive(false);
            } finally {
                setIsRoleLoading(false);
            }
        };

        fetchOrSetUserProfile();

    }, [firebaseUser, isAuthLoading, firestore]);
    
    const authInfo: AuthContextType = {
        user: firebaseUser,
        userRole,
        isRoleLoading: isAuthLoading || isRoleLoading, // Overall loading is true if either auth or role is loading
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

    
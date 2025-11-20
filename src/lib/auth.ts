
'use client';

import { useUser } from '@/firebase/provider';
import React, { createContext, useContext, ReactNode } from 'react';

type UserRole = 'superadmin' | 'admin' | 'viewer';

interface AuthContextType {
    userRole: UserRole;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { user, isUserLoading } = useUser();

    // For development, always return 'superadmin' to ensure all UI is accessible.
    const authInfo = {
        user,
        userRole: 'superadmin' as UserRole,
        isLoading: isUserLoading
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

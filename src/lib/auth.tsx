
'use client';

import React, { createContext, useContext, ReactNode } from 'react';

type UserRole = 'superadmin' | 'admin' | 'viewer';

interface AuthContextType {
    userRole: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {

    // For development, always return 'superadmin' to ensure all UI is accessible.
    const authInfo = {
        userRole: 'superadmin' as UserRole,
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

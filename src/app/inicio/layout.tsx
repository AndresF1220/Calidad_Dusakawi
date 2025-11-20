
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import { AuthProvider, useAuth } from '@/lib/auth.tsx';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { Loader2, UserX } from 'lucide-react';
import React from 'react';

function InactiveUserScreen() {
    const app = useFirebaseApp();
    
    const handleLogout = () => {
        const auth = getAuth(app);
        signOut(auth);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <UserX className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold font-headline mb-2">Tu usuario está inactivo</h1>
            <p className="text-muted-foreground mb-6">No tienes permiso para acceder al sistema. Por favor, contacta al administrador.</p>
            <Button onClick={handleLogout}>Cerrar Sesión</Button>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verificando acceso...</p>
        </div>
    )
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const { isRoleLoading, isActive } = useAuth();
    
    if (isRoleLoading) {
        return <LoadingScreen />;
    }

    if (!isActive) {
        return <InactiveUserScreen />;
    }
    
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <AppHeader />
                <main className="p-4 sm:p-6 lg:p-8 bg-background">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}


export default function InicioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
        <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthProvider>
  );
}

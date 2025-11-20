
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface AppSettings {
    appName: string;
    companyName: string;
}

interface AppSettingsContextType {
    settings: AppSettings;
    isLoading: boolean;
}

const defaultSettings: AppSettings = {
    appName: 'Sistema de Gestión',
    companyName: 'Empresa',
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
    const { firestore } = useFirebase();
    
    const settingsRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'settings', 'app') : null),
      [firestore]
    );

    const { data: appSettings, isLoading } = useDoc<AppSettings>(settingsRef);

    const settings = appSettings ? {
      appName: appSettings.appName || defaultSettings.appName,
      companyName: appSettings.companyName || defaultSettings.companyName,
    } : defaultSettings;

    const value = {
      settings,
      isLoading
    };

    return (
        <AppSettingsContext.Provider value={value}>
            {children}
        </AppSettingsContext.Provider>
    );
}

export function useAppSettings() {
    const context = useContext(AppSettingsContext);
    if (context === undefined) {
        throw new Error("useAppSettings must be used within an AppSettingsProvider");
    }
    return context;
}

    
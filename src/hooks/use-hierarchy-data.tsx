
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import type { Area, Proceso, Subproceso } from './use-areas-data';

export type HierarchyItem = {
  id: string;
  name: string;
  type: 'area' | 'proceso' | 'subproceso';
  areaId: string;
  areaNombre: string;
  procesoId?: string | null;
  procesoNombre?: string | null;
  subprocesoId?: string | null;
  subprocesoNombre?: string | null;
};

export type FlatHierarchyItem = HierarchyItem & { level: number };

interface HierarchyContextType {
  hierarchy: FlatHierarchyItem[];
  isLoading: boolean;
  error: Error | null;
}

const HierarchyContext = createContext<HierarchyContextType | undefined>(undefined);

export function HierarchyProvider({ children }: { children: React.ReactNode }) {
  const { firestore } = useFirebase();
  const [hierarchy, setHierarchy] = useState<FlatHierarchyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFullHierarchy = async () => {
      if (!firestore) return;

      setIsLoading(true);
      setError(null);
      const flatList: FlatHierarchyItem[] = [];

      try {
        const areasQuery = query(collection(firestore, 'areas'));
        const areasSnap = await getDocs(areasQuery);
        const areas = areasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Area));

        const allProcesosPromises = areas.map(async (area) => {
          flatList.push({
            id: area.id, name: area.nombre, type: 'area', level: 0,
            areaId: area.id, areaNombre: area.nombre
          });

          const procesosQuery = query(collection(firestore, 'areas', area.id, 'procesos'));
          const procesosSnap = await getDocs(procesosQuery);
          const procesos = procesosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proceso));

          const allSubprocesosPromises = procesos.map(async (proceso) => {
            flatList.push({
              id: proceso.id, name: proceso.nombre, type: 'proceso', level: 1,
              areaId: area.id, areaNombre: area.nombre,
              procesoId: proceso.id, procesoNombre: proceso.nombre
            });
            
            const subprocesosQuery = query(collection(firestore, 'areas', area.id, 'procesos', proceso.id, 'subprocesos'));
            const subprocesosSnap = await getDocs(subprocesosQuery);
            const subprocesos = subprocesosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subproceso));

            subprocesos.forEach(subproceso => {
              flatList.push({
                id: subproceso.id, name: subproceso.nombre, type: 'subproceso', level: 2,
                areaId: area.id, areaNombre: area.nombre,
                procesoId: proceso.id, procesoNombre: proceso.nombre,
                subprocesoId: subproceso.id, subprocesoNombre: subproceso.nombre,
              });
            });
          });

          await Promise.all(allSubprocesosPromises);
        });

        await Promise.all(allProcesosPromises);

        // Sort the flat list to ensure parent items come before children
        flatList.sort((a, b) => {
            if (a.areaId !== b.areaId) return a.areaNombre.localeCompare(b.areaNombre);
            if (a.type === 'area') return -1;
            if (b.type === 'area') return 1;

            if (a.procesoId !== b.procesoId) {
                if (!a.procesoId) return -1;
                if (!b.procesoId) return 1;
                return a.procesoNombre!.localeCompare(b.procesoNombre!);
            }
            if (a.type === 'proceso') return -1;
            if (b.type === 'proceso') return 1;
            
            if (!a.subprocesoId) return -1;
            if (!b.subprocesoId) return 1;
            return a.subprocesoNombre!.localeCompare(b.subprocesoNombre!);
        });

        setHierarchy(flatList);
      } catch (err: any) {
        console.error("Error fetching full hierarchy:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (hierarchy.length === 0) {
      fetchFullHierarchy();
    } else {
      setIsLoading(false);
    }
  }, [firestore, hierarchy.length]);

  return (
    <HierarchyContext.Provider value={{ hierarchy, isLoading, error }}>
      {children}
    </HierarchyContext.Provider>
  );
}

export function useHierarchy() {
  const context = useContext(HierarchyContext);
  if (context === undefined) {
    throw new Error('useHierarchy must be used within a HierarchyProvider');
  }
  return context;
}

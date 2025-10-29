
'use client';

import { useMemo } from 'react';
import { collection, doc, query, where, getDocs } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';

export type Subproceso = {
    id: string;
    nombre: string;
}

export type Proceso = {
    id: string;
    nombre: string;
}

export type Area = {
    id: string;
    nombre: string;
}

const slugify = (text: string) => {
    if (!text) return '';
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

export function useAreas() {
    const firestore = useFirestore();
    const areasQuery = useMemoFirebase(() => query(collection(firestore, 'areas')), [firestore]);
    const { data: areas, isLoading, error } = useCollection<Area>(areasQuery);

    return { areas, isLoading, error };
}

export function useArea(areaId: string | null) {
    const firestore = useFirestore();
    const areaRef = useMemoFirebase(() => areaId ? doc(firestore, 'areas', areaId) : null, [firestore, areaId]);
    const { data: area, isLoading, error } = useDoc<Area>(areaRef);

    return { area, isLoading, error };
}

export function useProcesos(areaId: string | null) {
    const firestore = useFirestore();
    const procesosQuery = useMemoFirebase(() => areaId ? query(collection(firestore, 'areas', areaId, 'procesos')) : null, [firestore, areaId]);
    const { data: procesos, isLoading, error } = useCollection<Proceso>(procesosQuery);
    
    return { procesos, isLoading, error };
}

export function useProceso(areaId: string | null, procesoId: string | null) {
    const firestore = useFirestore();
    const procesoRef = useMemoFirebase(() => areaId && procesoId ? doc(firestore, 'areas', areaId, 'procesos', procesoId) : null, [firestore, areaId, procesoId]);
    const { data: proceso, isLoading, error } = useDoc<Proceso>(procesoRef);

    return { proceso, isLoading, error };
}

export function useSubprocesos(areaId: string | null, procesoId: string | null) {
    const firestore = useFirestore();
    const subprocesosQuery = useMemoFirebase(() => areaId && procesoId ? query(collection(firestore, 'areas', areaId, 'procesos', procesoId, 'subprocesos')) : null, [firestore, areaId, procesoId]);
    const { data: subprocesos, isLoading, error } = useCollection<Subproceso>(subprocesosQuery);
    
    return { subprocesos, isLoading, error };
}

// This hook is more complex as it needs to find a sub-process by its slugified name, not by ID.
export function useSubproceso(areaId: string | null, procesoId: string | null, subprocesoSlug: string | null) {
    const { subprocesos, isLoading, error } = useSubprocesos(areaId, procesoId);
    
    const subproceso = useMemo(() => {
        if (!subprocesos || !subprocesoSlug) return null;
        return subprocesos.find(sp => slugify(sp.nombre) === subprocesoSlug) || null;
    }, [subprocesos, subprocesoSlug]);

    return { subproceso, isLoading, error };
}

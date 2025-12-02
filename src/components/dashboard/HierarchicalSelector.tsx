
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Area, Proceso, Subproceso } from '@/hooks/use-areas-data';

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

type FlatHierarchyItem = HierarchyItem & { level: number };

interface HierarchicalSelectorProps {
  selectedItem: HierarchyItem | null;
  onSelectItem: (item: HierarchyItem | null) => void;
}

export function HierarchicalSelector({
  selectedItem,
  onSelectItem,
}: HierarchicalSelectorProps) {
  const [open, setOpen] = useState(false);
  const [hierarchy, setHierarchy] = useState<FlatHierarchyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchHierarchy = async () => {
      if (!firestore) return;
      setIsLoading(true);
      const flatList: FlatHierarchyItem[] = [];

      try {
        const areasQuery = query(collection(firestore, 'areas'));
        const areasSnap = await getDocs(areasQuery);
        const areas = areasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Area));

        for (const area of areas) {
          flatList.push({
            id: area.id,
            name: area.nombre,
            type: 'area',
            level: 0,
            areaId: area.id,
            areaNombre: area.nombre,
          });

          const procesosQuery = query(collection(firestore, 'areas', area.id, 'procesos'));
          const procesosSnap = await getDocs(procesosQuery);
          const procesos = procesosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proceso));

          for (const proceso of procesos) {
            flatList.push({
              id: proceso.id,
              name: proceso.nombre,
              type: 'proceso',
              level: 1,
              areaId: area.id,
              areaNombre: area.nombre,
              procesoId: proceso.id,
              procesoNombre: proceso.nombre,
            });

            const subprocesosQuery = query(collection(firestore, 'areas', area.id, 'procesos', proceso.id, 'subprocesos'));
            const subprocesosSnap = await getDocs(subprocesosQuery);
            const subprocesos = subprocesosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subproceso));
            
            for (const subproceso of subprocesos) {
              flatList.push({
                id: subproceso.id,
                name: subproceso.nombre,
                type: 'subproceso',
                level: 2,
                areaId: area.id,
                areaNombre: area.nombre,
                procesoId: proceso.id,
                procesoNombre: proceso.nombre,
                subprocesoId: subproceso.id,
                subprocesoNombre: subproceso.nombre,
              });
            }
          }
        }
        setHierarchy(flatList);
      } catch (error) {
        console.error("Error fetching hierarchy:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHierarchy();
  }, [firestore]);

  const findItemById = (id: string | null) => {
    if (!id) return null;
    return hierarchy.find(item => item.id === id) || null;
  };
  
  const getDisplayValue = () => {
    if (isLoading) return 'Cargando...';
    if (!selectedItem || !selectedItem.id) return 'Seleccione una asignación...';
    
    const item = findItemById(selectedItem.id);
    return item ? item.name : 'Seleccione una asignación...';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{getDisplayValue()}</span>
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar asignación..." />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {hierarchy.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onSelectItem(item);
                    setOpen(false);
                  }}
                  style={{ paddingLeft: `${1 + item.level * 1.5}rem` }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedItem?.id === item.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

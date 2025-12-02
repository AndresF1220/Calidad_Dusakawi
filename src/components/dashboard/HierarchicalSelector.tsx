
'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

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
import { useHierarchy } from '@/hooks/use-hierarchy-data';
import type { HierarchyItem } from '@/hooks/use-hierarchy-data';

interface HierarchicalSelectorProps {
  selectedItem: HierarchyItem | null;
  onSelectItem: (item: HierarchyItem | null) => void;
}

export function HierarchicalSelector({
  selectedItem,
  onSelectItem,
}: HierarchicalSelectorProps) {
  const [open, setOpen] = useState(false);
  const { hierarchy, isLoading } = useHierarchy();

  const findItemById = (id: string | null) => {
    if (!id) return null;
    return hierarchy.find(item => item.id === id && item.type === (selectedItem?.type || '')) || null;
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
                  key={`${item.type}-${item.id}`}
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
                      selectedItem?.id === item.id && selectedItem?.type === item.type ? 'opacity-100' : 'opacity-0'
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


'use client';

import { useState, useMemo } from 'react';
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
import type { HierarchyItem, FlatHierarchyItem } from '@/hooks/use-hierarchy-data';

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
  const [searchValue, setSearchValue] = useState('');

  const filteredHierarchy = useMemo(() => {
    if (!searchValue) {
      return hierarchy;
    }

    const lowercasedQuery = searchValue.toLowerCase();
    const matchingItems = new Set<string>(); // Stores "type-id"
    const parentsToShow = new Set<string>(); // Stores parent "type-id"s

    // First pass: find direct matches
    hierarchy.forEach(item => {
      if (item.name.toLowerCase().includes(lowercasedQuery)) {
        matchingItems.add(`${item.type}-${item.id}`);

        // Add its parents to the list of parents to show
        if (item.areaId) parentsToShow.add(`area-${item.areaId}`);
        if (item.procesoId) parentsToShow.add(`proceso-${item.procesoId}`);
      }
    });
    
    // Second pass: build the final list
    return hierarchy.filter(item => {
       const key = `${item.type}-${item.id}`;
       // Show item if it's a direct match OR if it's a parent of a matching item
       return matchingItems.has(key) || parentsToShow.has(key);
    });
  }, [hierarchy, searchValue]);

  const getDisplayValue = () => {
    if (isLoading) return 'Cargando...';
    if (!selectedItem || !selectedItem.id) return 'Seleccione un área...';
    
    return selectedItem.name || 'Seleccione un área...';
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
          <CommandInput 
            placeholder="Buscar área..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {filteredHierarchy.map((item, index) => (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  value={item.name}
                  onSelect={() => {
                    onSelectItem(item);
                    setOpen(false);
                  }}
                  style={{ paddingLeft: `${0.5 + item.level * 1.2}rem` }}
                  className={cn(
                    'flex items-center',
                    item.level === 0 && index > 0 && 'border-t mt-1 pt-1'
                  )}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedItem?.id === item.id && selectedItem?.type === item.type ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span>{item.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

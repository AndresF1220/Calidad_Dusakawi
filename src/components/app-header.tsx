'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import AppSidebarNav from './app-sidebar-nav';
import { Fragment, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useArea, useProceso, useSubproceso } from '@/hooks/use-areas-data';

const hardcodedTranslations: Record<string, string> = {
    inicio: "Inicio",
    reports: "Informes",
    alerts: "Alertas",
    feedback: "Feedback",
    documentos: "Mapa de Procesos",
    account: "Cuenta",
    area: "Área",
    proceso: "Proceso",
    subproceso: "Subproceso",
};

// A hook to fetch breadcrumb data dynamically
function useBreadcrumbData(segments: string[]) {
    const areaId = segments[2] === 'area' && segments.length > 3 ? segments[3] : null;
    const procesoId = segments[2] === 'area' && segments.length > 5 ? segments[5] : null;
    const subprocesoId = segments[2] === 'area' && segments.length > 7 ? segments[7] : null;

    const { area, isLoading: isLoadingArea } = useArea(areaId);
    const { proceso, isLoading: isLoadingProceso } = useProceso(areaId, procesoId);
    const { subproceso, isLoading: isLoadingSubproceso } = useSubproceso(areaId, procesoId, subprocesoId);

    return {
        area,
        proceso,
        subproceso,
        isLoading: isLoadingArea || isLoadingProceso || isLoadingSubproceso,
    };
}


export default function AppHeader() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  const { area, proceso, subproceso, isLoading } = useBreadcrumbData(pathSegments);

  const breadcrumbItems = useMemo(() => {
    return pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;
        let label = hardcodedTranslations[segment] || segment;

        if (index === 3 && area) { // areaId
            label = area.nombre;
        } else if (index === 5 && proceso) { // procesoId
            label = proceso.nombre;
        } else if (index === 7 && subproceso) { // subprocesoId
            label = subproceso.nombre;
        } else if (isLast && isLoading) {
            label = 'Cargando...';
        }
        
        return { href, label, isLast };
    });
  }, [pathSegments, area, proceso, subproceso, isLoading]);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Alternar menú de navegación</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 bg-sidebar text-sidebar-foreground">
          <AppSidebarNav isMobile={true} />
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
             {breadcrumbItems.map((item, index) => (
                <Fragment key={item.href}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {item.isLast ? (
                       <BreadcrumbPage className="font-normal capitalize">{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href} className="capitalize">
                          {item.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
             ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
               <AvatarImage src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxwcm9maWxlfGVufDB8fHx8MTc2MTY0MDYwMXww&ixlib=rb-4.1.0&q=80&w=1080" alt="Dra. Ana Rodriguez" />
               <AvatarFallback>AR</AvatarFallback>
            </Avatar>
            <span className="sr-only">Alternar menú de usuario</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Configuración</DropdownMenuItem>
          <DropdownMenuItem>Soporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/">Cerrar Sesión</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

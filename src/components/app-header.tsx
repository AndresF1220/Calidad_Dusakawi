
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
import { Fragment } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAreaById, getProceso } from '@/data/areasProcesos';

export default function AppHeader() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  const translateSegment = (segment: string, allSegments: string[], index: number) => {
    // Hardcoded translations
    const translations: Record<string, string> = {
        inicio: "Inicio",
        reports: "Informes",
        alerts: "Alertas",
        feedback: "Feedback",
        documentos: "Mapa de procesos",
        account: "Cuenta",
    };

    if (translations[segment.toLowerCase()]) {
        return translations[segment.toLowerCase()];
    }

    // Dynamic translations for areas and procesos
    if (allSegments[1] === 'documentos' && allSegments.length > 2) {
      const areaId = allSegments[2];
      const area = getAreaById(areaId);
      if (area && segment === area.id) {
        return area.titulo;
      }
      if (allSegments.length > 3) {
        const procesoId = allSegments[3];
        const proceso = getProceso(areaId, procesoId);
        if (proceso && segment === proceso.id) {
          return proceso.nombre;
        }
      }
    }
    
    return segment;
  }

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
             {pathSegments.length > 0 && pathSegments[0] === 'inicio' && (
                <BreadcrumbItem>
                    {pathSegments.length === 1 ? (
                        <BreadcrumbPage className="font-normal">Inicio</BreadcrumbPage>
                    ) : (
                        <BreadcrumbLink asChild>
                            <Link href="/inicio">Inicio</Link>
                        </BreadcrumbLink>
                    )}
                </BreadcrumbItem>
             )}

            {pathSegments.slice(1).map((segment, index) => {
               const href = `/${pathSegments.slice(0, index + 2).join('/')}`;
               const isLast = index === pathSegments.length - 2;
               const translatedSegment = translateSegment(segment, pathSegments, index + 1);

              return (
              <Fragment key={segment}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                     <BreadcrumbPage className="font-normal capitalize">{translatedSegment}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={href} className="capitalize">
                        {translatedSegment}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            )})}
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

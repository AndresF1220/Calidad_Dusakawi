
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { DusakawiLogo } from './icons';
import {
  LayoutDashboard,
  BarChart3,
  Bell,
  MessageSquareHeart,
  User,
  FolderKanban,
  UserCog,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/lib/auth';
import { Skeleton } from './ui/skeleton';
import { useAppSettings } from '@/hooks/use-app-settings';


interface AppSidebarNavProps {
  isMobile: boolean;
}

export default function AppSidebarNav({ isMobile }: AppSidebarNavProps) {
  const pathname = usePathname();
  const { user, userRole, isRoleLoading } = useAuth();
  const { settings, isLoading: isSettingsLoading } = useAppSettings();
  
  const menuItems = [
    { href: '/inicio', label: 'Inicio', icon: LayoutDashboard },
    { href: '/inicio/documentos', label: 'Mapa de Procesos', icon: FolderKanban },
    { href: '/inicio/reports', label: 'Informes', icon: BarChart3, roles: ['superadmin', 'admin'] },
    { href: '/inicio/alerts', label: 'Alertas', icon: Bell, roles: ['superadmin', 'admin'] },
    { href: '/inicio/feedback', label: 'Feedback', icon: MessageSquareHeart },
  ];

  const bottomMenuItems = [
    { href: '/inicio/administracion', label: 'Administración', icon: UserCog, roles: ['superadmin'] },
    { href: '/inicio/account', label: 'Cuenta', icon: User },
  ]

  const isInicioActive = pathname === '/inicio';
  const userInitial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U';

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2.5 p-4 h-16">
          <DusakawiLogo className="h-8 w-8 text-sidebar-primary" />
          <span className="text-lg font-headline font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            {isSettingsLoading ? <Skeleton className="h-5 w-24 bg-muted-foreground/20" /> : settings.appName}
          </span>
        </div>
      </SidebarHeader>
      
      <div className="flex flex-col items-center gap-2 p-4 group-data-[collapsible=icon]:py-4 group-data-[collapsible=icon]:px-2">
        <Avatar className="h-16 w-16 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 transition-all">
            <AvatarImage src={user?.photoURL || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxwcm9maWxlfGVufDB8fHx8MTc2MTY0MDYwMXww&ixlib=rb-4.1.0&q=80&w=1080"} alt={user?.displayName || 'Usuario'} />
            <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
        <div className="text-center group-data-[collapsible=icon]:hidden">
            <h3 className="font-semibold text-base text-sidebar-foreground truncate max-w-36">{user?.displayName || user?.email || 'Usuario'}</h3>
            <p className="text-sm text-sidebar-foreground/70">{isSettingsLoading ? '...' : settings.companyName}</p>
        </div>
      </div>
      <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

      <SidebarContent className="p-2 flex-1">
        <SidebarMenu>
          {isRoleLoading ? (
            <div className="space-y-2 px-2">
              <Skeleton className="h-8 w-full bg-muted-foreground/20" />
              <Skeleton className="h-8 w-full bg-muted-foreground/20" />
              <Skeleton className="h-8 w-full bg-muted-foreground/20" />
            </div>
          ) : menuItems
            .filter(item => !item.roles || (userRole && item.roles.includes(userRole)))
            .map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={item.href === '/inicio' ? isInicioActive : pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />
      
      <SidebarContent className="p-2 flex-none">
        <SidebarMenu>
            {isRoleLoading ? (
                <div className="flex items-center justify-center text-xs text-sidebar-foreground/70 gap-2 p-2 group-data-[collapsible=icon]:hidden">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verificando...</span>
                </div>
            ) : bottomMenuItems
                .filter(item => !item.roles || (userRole && item.roles.includes(userRole)))
                .map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.label}
                    >
                        <Link href={item.href}>
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}


'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { DusakawiLogo } from './icons';
import {
  LayoutDashboard,
  BarChart3,
  Bell,
  MessageSquareHeart,
  User,
  FolderKanban,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


interface AppSidebarNavProps {
  isMobile: boolean;
}

export default function AppSidebarNav({ isMobile }: AppSidebarNavProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { href: '/inicio', label: 'Inicio', icon: LayoutDashboard },
    { href: '/inicio/documentos', label: 'Mapa de Procesos', icon: FolderKanban },
    { href: '/inicio/reports', label: 'Informes', icon: BarChart3 },
    { href: '/inicio/alerts', label: 'Alertas', icon: Bell },
    { href: '/inicio/feedback', label: 'Feedback', icon: MessageSquareHeart },
    { href: '/inicio/account', label: 'Cuenta', icon: User },
  ];

  const isInicioActive = pathname === '/inicio';

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 p-4">
          <DusakawiLogo className="h-8 w-8 text-sidebar-primary" />
          <span className="text-lg font-headline font-semibold text-sidebar-foreground">
            Dusakawi
          </span>
        </div>
      </SidebarHeader>
      
      <div className="flex flex-col items-center gap-2 p-4 border-y border-sidebar-border">
        <Avatar className="h-16 w-16">
            <AvatarImage src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxwcm9maWxlfGVufDB8fHx8MTc2MTY0MDYwMXww&ixlib=rb-4.1.0&q=80&w=1080" alt="Dra. Ana Rodriguez" />
            <AvatarFallback>AR</AvatarFallback>
        </Avatar>
        <div className="text-center">
            <h3 className="font-semibold text-base text-sidebar-foreground">Dra. Ana Rodriguez</h3>
            <p className="text-sm text-sidebar-foreground/70">Dusakawi EPSI</p>
        </div>
      </div>

      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={item.href === '/inicio' ? isInicioActive : pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}

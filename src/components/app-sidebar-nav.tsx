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
  Folder,
} from 'lucide-react';
import UserPanelHeader from './user-panel-header';


interface AppSidebarNavProps {
  isMobile: boolean;
}

export default function AppSidebarNav({ isMobile }: AppSidebarNavProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { href: '/dashboard', label: 'Panel de Control', icon: LayoutDashboard },
    { href: '/dashboard/reports', label: 'Informes', icon: BarChart3 },
    { href: '/dashboard/alerts', label: 'Alertas', icon: Bell },
    { href: '/dashboard/feedback', label: 'Feedback', icon: MessageSquareHeart },
    { href: '/dashboard/repository', label: 'Repositorio', icon: Folder },
  ];

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 p-2">
          <DusakawiLogo className="h-8 w-8 text-sidebar-primary" />
          <span className="text-lg font-headline font-semibold text-sidebar-foreground">
            Dusakawi
          </span>
        </div>
      </SidebarHeader>
      
      <UserPanelHeader />

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
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

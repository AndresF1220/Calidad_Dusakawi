'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  SidebarContent,
  SidebarFooter,
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
  Settings,
  CircleUser,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface AppSidebarNavProps {
  isMobile: boolean;
}

export default function AppSidebarNav({ isMobile }: AppSidebarNavProps) {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/reports', label: 'Reporting', icon: BarChart3 },
    { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
    { href: '/dashboard/feedback', label: 'Feedback', icon: MessageSquareHeart },
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
      <SidebarFooter className="flex-col !items-stretch">
        <SidebarSeparator />
        <div className="flex items-center gap-2 p-2">
          {userAvatar && (
             <Image
                src={userAvatar.imageUrl}
                alt="User avatar"
                width={36}
                height={36}
                className="rounded-full"
                data-ai-hint={userAvatar.imageHint}
              />
          )}
          <div className="flex flex-col text-sm">
            <span className="font-semibold text-sidebar-foreground">
              Dr. Ana Rodriguez
            </span>
            <span className="text-sidebar-foreground/70">Quality Manager</span>
          </div>
        </div>
      </SidebarFooter>
    </>
  );
}

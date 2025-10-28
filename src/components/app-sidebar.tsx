import { Sidebar } from '@/components/ui/sidebar';
import AppSidebarNav from './app-sidebar-nav';

export default function AppSidebar() {
  return (
    <Sidebar
      className="border-r"
      collapsible="icon"
      variant="sidebar"
    >
      <AppSidebarNav isMobile={false} />
    </Sidebar>
  );
}

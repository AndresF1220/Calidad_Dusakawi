'use client';

import { useState } from 'react';
import { Home, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const user = {
  name: 'Dra. Ana Rodriguez',
  group: 'Dusakawi EPSI',
  role: 'admin',
};

export default function UserPanelHeader() {
  const [activeTab, setActiveTab] = useState('plan-individual');

  return (
    <div className="flex flex-col p-4 bg-sidebar text-sidebar-foreground gap-4 border-y border-sidebar-border">
      {/* User Info */}
      <div>
        <h3 className="font-semibold text-base">{user.name}</h3>
        <p className="text-sm text-sidebar-foreground/70">{user.group}</p>
      </div>

      {/* Tabs */}
      <div className="flex w-full bg-sidebar-accent p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('plan-individual')}
          className={cn(
            'w-1/2 py-1.5 text-sm font-medium rounded-md transition-colors',
            activeTab === 'plan-individual'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-primary/10'
          )}
        >
          Plan Individual
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={cn(
            'w-1/2 py-1.5 text-sm font-medium rounded-md transition-colors',
            activeTab === 'admin'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-primary/10'
          )}
        >
          Admin
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <Button variant="ghost" className="justify-start gap-3 px-3 h-11 text-base font-normal hover:bg-sidebar-accent">
          <Home className="h-5 w-5" />
          <span>Inicio</span>
        </Button>
        <Button variant="ghost" className="justify-start gap-3 px-3 h-11 text-base font-normal hover:bg-sidebar-accent">
          <UserCircle className="h-5 w-5" />
          <span>Cuenta</span>
        </Button>
      </div>
    </div>
  );
}

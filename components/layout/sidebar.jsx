'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

import {
  Building2,
  Users,
  Target,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  Search,
  Briefcase,
  MessageCircle,
  Award,
  Gift,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const founderNav = [
  { name: 'Dashboard', href: '/founder', icon: Home },
  { name: 'Investor Directory', href: '/founder/directory', icon: Search },
  { name: 'Smart Matching', href: '/founder/matching', icon: Zap },
  { name: 'Fundraising CRM', href: '/founder/crm', icon: Target },
  { name: 'My Pipeline', href: '/founder/pipeline', icon: Target },
  { name: 'Pitch Decks', href: '/founder/decks', icon: FileText },
  { name: 'Data Room', href: '/founder/dataroom', icon: Briefcase },
  { name: 'Analytics', href: '/founder/analytics', icon: BarChart3 },
  { name: 'Updates', href: '/founder/updates', icon: MessageCircle },
  { name: 'Introductions', href: '/founder/intros', icon: Users },
  { name: 'Perks', href: '/founder/perks', icon: Gift },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const investorNav = [
  { name: 'Dashboard', href: '/investor', icon: Home },
  { name: 'Startups', href: '/investor/startups', icon: Building2 },
  { name: 'Fundraising CRM', href: '/investor/crm', icon: Target },
  { name: 'My Pipeline', href: '/investor/pipeline', icon: Target },
  { name: 'Programs', href: '/investor/programs', icon: Award },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Organizations', href: '/admin/orgs', icon: Building2 },
  { name: 'Startups', href: '/admin/startups', icon: Building2 },
  { name: 'Investors', href: '/admin/investors', icon: Target },
  { name: 'Programs', href: '/admin/programs', icon: Award },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [resolvedRole, setResolvedRole] = useState('FOUNDER');

  const pathname = usePathname();
  const { user } = useAuth();

  // ✅ Make sure Sidebar renders *nothing* on server + first client render
  useEffect(() => {
    // Resolve role ONLY on client
    let role = (user?.user_metadata?.role || '').toUpperCase();

    if (!role) {
      if (pathname.startsWith('/investor')) role = 'INVESTOR';
      else if (pathname.startsWith('/admin')) role = 'ADMIN';
      else if (pathname.startsWith('/founder')) role = 'FOUNDER';
      else {
        const stored =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('currentUserRole')
            : null;
        role = (stored || 'FOUNDER').toUpperCase();
      }
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('currentUserRole', role);
    }

    setResolvedRole(role);
    setHasMounted(true);
  }, [user, pathname]);

  if (!hasMounted) {
    // server + first client paint both return null → no hydration mismatch
    return null;
  }

  const getNavigationItems = () => {
    switch (resolvedRole) {
      case 'INVESTOR':
        return investorNav;
      case 'ADMIN':
        return adminNav;
      case 'FOUNDER':
      default:
        return founderNav;
    }
  };

  const navigationItems = getNavigationItems();

  // Hide sidebar on auth pages
  if (pathname.startsWith('/auth/')) return null;

  const displayUser = user
    ? {
        id: user.id,
        name: user.user_metadata?.full_name || user.email,
        email: user.email,
        role: resolvedRole,
        image: user.user_metadata?.avatar_url || null,
      }
    : {
        id: 'mock-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: resolvedRole,
        image: null,
      };

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-card border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                IM
              </span>
            </div>
            <span className="text-lg font-semibold">InvestMatch</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive = (() => {
              if (pathname === item.href) return true;
              if (['/founder', '/investor', '/admin'].includes(item.href)) {
                return pathname === item.href;
              }
              return pathname.startsWith(item.href) && item.href !== '/';
            })();

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                    isCollapsed && 'justify-center px-0'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!isCollapsed && (
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-medium">
                {(displayUser.name || 'U').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {displayUser.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {(displayUser.role || 'user').toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

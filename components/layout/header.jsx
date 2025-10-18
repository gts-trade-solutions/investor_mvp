'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(user?.user_metadata?.role || null);
  }, [user]);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/signin';
  };

  return (
    <>
      {/* 🔹 Top navigation bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b ">
        <Link href="/" className="text-base font-medium hover:text-primary">
          Home
        </Link>

        {!loading && (
          user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Hi, {user.email}{role ? ` (${role.toLowerCase()})` : ''}
              </span>
              <Button variant="outline" onClick={onSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <Link href="/auth/signin">
              <Button>Sign in</Button>
            </Link>
          )
        )}
      </header>

      {/* 🔸 Demo notice bar */}
      <div className="bg-yellow-100 text-yellow-800 text-center py-2 text-sm font-medium border-b">
        ⚠️ This is a demo version of the platform. All data shown are mock examples for testing and preview purposes only.
      </div>
    </>
  );
}

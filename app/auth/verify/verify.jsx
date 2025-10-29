'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import supabase from '@/lib/supabaseClient';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(''); // FOUNDER | INVESTOR
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setEmail(searchParams?.get('email') || '');
    const r = (searchParams?.get('role') || '').toUpperCase();
    if (r === 'FOUNDER' || r === 'INVESTOR') setRole(r);
  }, [searchParams]);

  const resend = async () => {
    if (!email) return;
    setSending(true);
    setMsg(null);
    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL;

      const next =
        role === 'INVESTOR'
          ? '/onboarding/investor'
          : role === 'FOUNDER'
          ? '/onboarding/founder'
          : '/dashboard';

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });

      if (error) throw error;
      setMsg('✅ Verification email sent successfully.');
    } catch (err) {
      setMsg(`❌ ${err?.message || 'Something went wrong. Please try again.'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="card max-w-md w-full text-center p-6 space-y-6">
        <h1 className="text-2xl font-bold">Confirm your email</h1>

        {email ? (
          <p className="text-muted-foreground">
            We sent a verification link to <b className="text-foreground">{email}</b>.<br />
            After you click it, you’ll be redirected automatically.
          </p>
        ) : (
          <p className="text-muted-foreground">Please provide a valid email address during signup.</p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            disabled={!email || sending}
            onClick={resend}
            className={`px-4 py-2 rounded border transition ${
              sending ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted active:scale-95'
            }`}
          >
            {sending ? 'Resending…' : 'Resend email'}
          </button>

          <a href="mailto:" className="underline text-primary hover:opacity-80">
            Open mail app
          </a>
        </div>

        {msg && (
          <p
            className={`text-sm ${
              msg.startsWith('✅') ? 'text-green-600' : msg.startsWith('❌') ? 'text-red-600' : ''
            }`}
          >
            {msg}
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Wrong address?{' '}
          <Link href="/auth/signup" className="underline text-primary hover:opacity-80">
            Use another email
          </Link>
        </p>
      </div>
    </div>
  );
}

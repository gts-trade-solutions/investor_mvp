'use client';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import Link from 'next/link';

export default function VerifyPage() {
  const email = useSearchParams().get('email') || '';
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  const resend = async () => {
    setSending(true); setMsg('');
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSending(false);
    setMsg(error ? error.message : 'Verification email sent.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-bold">Confirm your email</h1>
        <p>We sent a verification link to <b>{email}</b>. After you click it, we’ll route you automatically.</p>
        <div className="flex gap-3 justify-center">
          <button disabled={!email || sending} onClick={resend} className="px-4 py-2 border rounded">
            {sending ? 'Resending…' : 'Resend email'}
          </button>
          <a href="mailto:" className="underline">Open mail app</a>
        </div>
        {msg && <p className="text-sm">{msg}</p>}
        <p className="text-sm">Wrong address? <Link href="/auth/signup" className="underline">Use another email</Link></p>
      </div>
    </div>
  );
}

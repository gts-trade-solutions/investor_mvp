'use client';


import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase/browser';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  // ✅ safely extract email after mount
  useEffect(() => {
    const paramEmail = searchParams?.get('email') || '';
    setEmail(paramEmail);
  }, [searchParams]);

  // 🔁 resend verification email
  const resend = async () => {
    if (!email) return;
    setSending(true);
    setMsg('');

    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setMsg('✅ Verification email sent successfully.');
    } catch (err) {
      console.error('Resend error:', err);
      setMsg('❌ Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full space-y-6 text-center bg-white p-6 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold">Confirm your email</h1>

        {email ? (
          <p>
            We sent a verification link to <b>{email}</b>. <br />
            After you click it, you’ll be redirected automatically.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Please provide a valid email address during signup.
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            disabled={!email || sending}
            onClick={resend}
            className={`px-4 py-2 border rounded transition ${
              sending
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:bg-gray-100 active:scale-95'
            }`}
          >
            {sending ? 'Resending…' : 'Resend email'}
          </button>

          <a
            href="mailto:"
            className="underline text-blue-600 hover:text-blue-800"
          >
            Open mail app
          </a>
        </div>

        {msg && (
          <p
            className={`text-sm ${
              msg.startsWith('✅')
                ? 'text-green-600'
                : msg.startsWith('❌')
                ? 'text-red-600'
                : 'text-gray-700'
            }`}
          >
            {msg}
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Wrong address?{' '}
          <Link
            href="/auth/signup"
            className="underline text-blue-600 hover:text-blue-800"
          >
            Use another email
          </Link>
        </p>
      </div>
    </div>
  );
}

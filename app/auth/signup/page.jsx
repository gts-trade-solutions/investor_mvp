'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FOUNDER', // 'FOUNDER' | 'INVESTOR'
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // ✅ read ?role=founder|investor from URL
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['founder', 'investor'].includes(roleParam.toLowerCase())) {
      setFormData(prev => ({ ...prev, role: roleParam.toUpperCase() }));
    }
  }, [searchParams]);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData), // includes { name, email, password, role }
    });

    const payload = await res.json();
    if (!res.ok) throw new Error(payload.message || 'Failed to create account');

    // Optional toast
    // toast({ title: 'Check your email', description: 'We sent a verification link.' });

    // ⬇️ Redirect to the "confirm your email" page
    router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
  } catch (err) {
    toast({
      title: 'Error',
      description: err.message,
      variant: 'destructive',
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create account</CardTitle>
          <CardDescription className="text-center">
            Join as a {formData.role === 'FOUNDER' ? 'founder' : 'investor'} and start connecting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={formData.role === 'FOUNDER' ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, role: 'FOUNDER' }))}
              disabled={isLoading}
            >
              Founder
            </Button>
            <Button
              type="button"
              variant={formData.role === 'INVESTOR' ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, role: 'INVESTOR' }))}
              disabled={isLoading}
            >
              Investor
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );  
}

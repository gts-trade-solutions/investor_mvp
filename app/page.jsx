'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Target, TrendingUp, Zap, Shield, ArrowRight, User } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import supabase from '@/lib/supabaseClient'; // ✅ your Supabase client

export default function HomePage() {
  const [user, setUser] = useState(null);

  // Certifications carousel images
  const CERTS = [
    { src: '/images/iso.webp', alt: 'ISO 9001 Certified' },
    { src: '/images/egac.webp', alt: 'EGAC Accredited' },
    { src: '/images/cmm.webp', alt: 'CMMI Level 3' },
    { src: '/images/image-33.webp', alt: 'Certification 1' },
    { src: '/images/image-35.webp', alt: 'Certification 2' },
    { src: '/images/image-38.webp', alt: 'Certification 3' },
    { src: '/images/image-39.webp', alt: 'Certification 4' },
  ];

  // 🧠 Get user session on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Listen to auth changes (realtime updates)
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    };

    getUser();
  }, []);

  // 🧩 Sign out handler
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        {/* Navigation */}
        <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">IM</span>
                </div>
                <span className="text-xl font-bold">InvestMatch</span>
              </div>

              {/* ✅ Dynamic right section */}
              <div className="flex items-center space-x-4">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-primary" />
                    <span className="font-medium">Hi, {user.user_metadata?.name || user.email}</span>
                    <Button asChild variant="outline">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    <Button onClick={handleSignOut} variant="ghost">
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button asChild variant="ghost">
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/auth/signup">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-background to-muted/50">
          <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Connect Investors &{' '}
                <span className="text-primary">Startups</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto">
                The premier platform for matching innovative startups with the right investors.
                Build relationships, manage your pipeline, and close deals faster.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/auth/signup?role=founder" className="flex items-center">
                    Get Started as Founder
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth/signup?role=investor">Join as Investor</Link>
                </Button>
              </div>
              <div className="mt-8 text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to succeed
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Powerful tools designed for modern fundraising and investment
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <Building2 className="h-8 w-8 text-primary" />
                  <CardTitle>Smart Matching</CardTitle>
                  <CardDescription>
                    AI-powered matching based on sector, stage, geography, and investment thesis
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 text-primary" />
                  <CardTitle>Pipeline Management</CardTitle>
                  <CardDescription>
                    Visual Kanban boards to track opportunities from first contact to closing
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary" />
                  <CardTitle>Warm Introductions</CardTitle>
                  <CardDescription>
                    Leverage your network for warm introductions to the right people
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <CardTitle>Deck Analytics</CardTitle>
                  <CardDescription>
                    Track engagement with your pitch decks and know when investors are interested
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-primary" />
                  <CardTitle>Secure Data Room</CardTitle>
                  <CardDescription>
                    Share sensitive documents securely with granular permission controls
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-primary" />
                  <CardTitle>Real-time Updates</CardTitle>
                  <CardDescription>
                    Keep stakeholders informed with regular updates and progress tracking
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        {/* Certifications Carousel */}
        <section className="bg-gradient-to-b from-background to-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Our <span className="text-primary">Certifications</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Race Innovationss Pvt. Ltd is ISO&nbsp;27001, ISO&nbsp;9001, and CMMI&nbsp;Level&nbsp;3 certified.
              </p>
            </div>

            <div className="relative mt-12">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

              <div dir="rtl">
                <Swiper
                  className="certs-ticker"
                  modules={[Autoplay]}
                  loop
                  slidesPerView="auto"
                  spaceBetween={24}
                  speed={9000}
                  autoplay={{
                    delay: 0,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }}
                  allowTouchMove
                  centeredSlides={false}
                >
                  {[...CERTS, ...CERTS, ...CERTS].map((c, i) => (
                    <SwiperSlide key={`${c.alt}-${i}`} style={{ width: '240px' }}>
                      <div className="relative h-28 sm:h-32 lg:h-36 w-full rounded-2xl bg-background border border-border shadow-sm p-5 sm:p-6">
                        <Image src={c.src} alt={c.alt} fill className="object-contain" sizes="240px" />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          </div>
        </section>

        <style jsx global>{`
          .certs-ticker .swiper-wrapper {
            transition-timing-function: linear !important;
          }
        `}</style>
      </div>

      <SiteFooter />
    </>
  );
}

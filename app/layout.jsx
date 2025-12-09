import './globals.css'
import { Inter } from 'next/font/google'
import Script from 'next/script'              // ⬅️ add this

import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { getSession } from '@/lib/rbac'
import AuthProvider from '@/components/providers/auth-provider'
import Sidebar from '@/components/layout/sidebar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata = {
  title: 'InvestMatch - Connect Investors & Startups',
  description: 'The premier platform for connecting investors with innovative startups',
}

export default async function RootLayout({ children }) {
  const session = await getSession()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Razorpay Checkout script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

        {/* Your existing providers */}
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* (Optional) If you actually use ThemeProvider / Toaster, wrap them here */}
        {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider> */}
      </body>
    </html>
  )
}

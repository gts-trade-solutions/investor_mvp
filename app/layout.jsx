import './globals.css'
import { Inter } from 'next/font/google'

import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { getSession } from '@/lib/rbac'
import AuthProvider from '@/components/providers/auth-provider'
import Sidebar from '@/components/layout/sidebar';   

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

export const metadata = {
  title: 'InvestMatch - Connect Investors & Startups',
  description: 'The premier platform for connecting investors with innovative startups',
}

export default async function RootLayout({ children }) {
  const session = await getSession()

  return (
    <html lang="en" suppressHydrationWarnings>
      <body className={inter.className}>
         <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
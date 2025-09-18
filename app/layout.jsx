import './globals.css'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/providers/session-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { getSession } from '@/lib/rbac'

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
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="investmatch-theme"
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
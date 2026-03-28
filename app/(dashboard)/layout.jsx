// import { Sidebar } from '@/components/layout/sidebar'
// import { Header } from '@/components/layout/header'
import  Header  from  '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { getSession } from '@/lib/rbac'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }) {
  // For settings page, always allow access for UI testing
  const session = await getSession()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBanner } from '@/components/layout/TopBanner'
import './globals.css'

export const metadata: Metadata = {
  title: 'XRANKFLOW Command Center',
  description: 'Multi-brand operations management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-primary-light dark:bg-gray-950">
        <TopBanner />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-sidebar min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
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
        <AuthProvider>
          <ProtectedLayout>
            {children}
          </ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  )
}

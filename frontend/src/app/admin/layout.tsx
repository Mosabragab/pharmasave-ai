'use client'

import { usePathname } from 'next/navigation'
import AdminAuthGuard from '@/components/admin/AdminAuthGuard'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Don't apply auth guard to signin page
  if (pathname === '/admin/signin') {
    return <>{children}</>
  }
  
  return (
    <AdminAuthGuard>
      {children}
    </AdminAuthGuard>
  )
}
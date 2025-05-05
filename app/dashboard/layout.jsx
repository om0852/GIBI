'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Sidebar from "@/components/Sidebar"
import TopNav from "@/components/TopNav"
export default function DashboardLayout({
  children,
}) {
  const { status } = useSession()

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 
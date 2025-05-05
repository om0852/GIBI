'use client'

import { useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Sidebar from "@/components/Sidebar"
import TopNav from "@/components/TopNav"

export default function DashboardLayout({ children }) {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <TopNav />
      <Sidebar />
      <main className="pl-64 pt-16">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
} 
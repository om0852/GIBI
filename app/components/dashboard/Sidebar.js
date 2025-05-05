'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  UserGroupIcon,
  CodeBracketIcon,
  CogIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Repositories', href: '/dashboard/repos', icon: CodeBracketIcon },
  { name: 'Contributors', href: '/dashboard/contributors', icon: UserGroupIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: DocumentChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link href="/dashboard" className="text-xl font-bold text-gray-800 dark:text-white">
              Gibi Analytics
            </Link>
          </div>
          <nav className="mt-8 flex-1 space-y-1 px-2" aria-label="Sidebar">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-6 w-6 flex-shrink-0 ${
                      isActive
                        ? 'text-gray-500 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
} 
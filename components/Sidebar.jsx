import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white transition-transform dark:border-gray-700 dark:bg-gray-800">
      <div className="h-full overflow-y-auto bg-white px-3 py-4 dark:bg-gray-800">
        <ul className="space-y-2 font-medium">
          <li>
            <Link href="/dashboard" className="flex items-center rounded-lg p-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
              <span className="ml-3">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/dashboard/profile" className="flex items-center rounded-lg p-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
              <span className="ml-3">Profile</span>
            </Link>
          </li>
          <li>
            <Link href="/dashboard/settings" className="flex items-center rounded-lg p-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
              <span className="ml-3">Settings</span>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  )
} 
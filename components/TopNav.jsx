import { signOut } from 'next-auth/react'

export default function TopNav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
              Dashboard
            </span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
} 
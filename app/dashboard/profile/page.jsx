'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { useTheme } from '@/components/ThemeProvider'

export default function ProfilePage() {
  const { user } = useUser()
  const { theme, toggleTheme } = useTheme()
  const [connections, setConnections] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('gitConnections')
    if (saved) {
      setConnections(JSON.parse(saved))
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-4">
            <img
              src={user?.imageUrl}
              alt={user?.fullName || 'Profile'}
              className="h-16 w-16 rounded-full"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user?.fullName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</h3>
              <p className="mt-1 text-gray-900 dark:text-white">{user?.username}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
              <p className="mt-1 text-gray-900 dark:text-white">
                {new Date(user?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Connected Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Connected Accounts
          </h2>
          <div className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection.platform}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {connection.platform === 'GITHUB' ? '🐱' :
                     connection.platform === 'GITLAB' ? '🦊' : '🪣'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {connection.platform}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {connection.userData?.login || connection.userData?.username}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Connected {new Date(connection.connectedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
} 
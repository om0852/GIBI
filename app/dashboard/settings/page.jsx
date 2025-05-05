'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      commits: true,
      pullRequests: true,
      issues: false
    },
    display: {
      compactView: false,
      showPrivateRepos: true,
      defaultChartPeriod: '3months'
    }
  })

  const handleSettingChange = (category, setting) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }))
  }

  const handleChartPeriodChange = (period) => {
    setSettings(prev => ({
      ...prev,
      display: {
        ...prev.display,
        defaultChartPeriod: period
      }
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Theme Preferences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Color Theme</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose between light and dark mode
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notification Preferences
          </h2>
          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive notifications for {key.toLowerCase()}
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('notifications', key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Display Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Display Settings
          </h2>
          <div className="space-y-4">
            {Object.entries(settings.display)
              .filter(([key]) => typeof settings.display[key] === 'boolean')
              .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {key === 'compactView'
                        ? 'Show repositories in a compact list view'
                        : 'Show private repositories in the list'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('display', key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
            ))}

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Default Chart Period
              </h3>
              <select
                value={settings.display.defaultChartPeriod}
                onChange={(e) => handleChartPeriodChange(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="1month">1 Month</option>
                <option value="3months">3 Months</option>
                <option value="6months">6 Months</option>
                <option value="1year">1 Year</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 
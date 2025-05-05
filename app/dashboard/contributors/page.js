'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

export default function ContributorsPage() {
  const { data: session } = useSession()
  const [selectedRepo, setSelectedRepo] = useState('')
  const [contributors, setContributors] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedRepo && session?.accessToken) {
      setLoading(true)
      const [owner, repo] = selectedRepo.split('/')
      
      const fetchContributors = async () => {
        try {
          const response = await fetch(`/api/github/analyze?repo=${selectedRepo}&token=${session.accessToken}`)
          const data = await response.json()
          setContributors(data.contributors)
        } catch (error) {
          console.error('Error fetching contributors:', error)
        } finally {
          setLoading(false)
        }
      }

      fetchContributors()
    }
  }, [selectedRepo, session])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Contributors Analysis
        </h1>
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">Select a repository</option>
          <option value="facebook/react">facebook/react</option>
          <option value="vercel/next.js">vercel/next.js</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {contributors.map((contributor) => (
            <motion.div
              key={contributor.username}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={contributor.avatarUrl}
                    alt={contributor.username}
                    className="h-12 w-12 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {contributor.username}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Active for {contributor.contributionPeriod}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Commits
                    </dt>
                    <dd className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                      {contributor.totalCommits}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Additions
                    </dt>
                    <dd className="mt-1 text-xl font-semibold text-green-600 dark:text-green-400">
                      +{contributor.totalAdditions}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Deletions
                    </dt>
                    <dd className="mt-1 text-xl font-semibold text-red-600 dark:text-red-400">
                      -{contributor.totalDeletions}
                    </dd>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Skill Rating
                  </h4>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{ width: `${contributor.skillScore * 10}%` }}
                      />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      {contributor.skillScore}/10
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
} 
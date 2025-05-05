'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useSession } from 'next-auth/react'
import { Octokit } from '@octokit/rest'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function DashboardPage() {
  const { data: session } = useSession()
  const [selectedRepo, setSelectedRepo] = useState('')
  const [repoStats, setRepoStats] = useState({
    commits: 0,
    pullRequests: 0,
    issues: 0,
    stars: 0,
    forks: 0,
  })
  const [commitData, setCommitData] = useState({
    labels: [],
    datasets: [],
  })

  useEffect(() => {
    if (selectedRepo && session?.accessToken) {
      const octokit = new Octokit({ auth: session.accessToken })
      const [owner, repo] = selectedRepo.split('/')

      // Fetch repository statistics
      const fetchRepoStats = async () => {
        try {
          const [repoData, commits, prs, issues] = await Promise.all([
            octokit.repos.get({ owner, repo }),
            octokit.repos.getCommitActivityStats({ owner, repo }),
            octokit.pulls.list({ owner, repo, state: 'all' }),
            octokit.issues.listForRepo({ owner, repo, state: 'all' }),
          ])

          setRepoStats({
            commits: commits.data.reduce((acc, week) => acc + week.total, 0),
            pullRequests: prs.data.length,
            issues: issues.data.length,
            stars: repoData.data.stargazers_count,
            forks: repoData.data.forks_count,
          })

          // Process commit data for chart
          const labels = commits.data.map((week) => 
            new Date(week.week * 1000).toLocaleDateString()
          ).slice(-12)

          setCommitData({
            labels,
            datasets: [
              {
                label: 'Commits',
                data: commits.data.map((week) => week.total).slice(-12),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
              },
            ],
          })
        } catch (error) {
          console.error('Error fetching repo stats:', error)
        }
      }

      fetchRepoStats()
    }
  }, [selectedRepo, session])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
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

      {selectedRepo && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(repoStats).map(([key, value]) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow"
              >
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {value}
                  </dd>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Commit Activity
              </h3>
              <div className="h-80">
                <Line
                  data={commitData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          color: 'rgb(107, 114, 128)',
                        },
                      },
                      x: {
                        ticks: {
                          color: 'rgb(107, 114, 128)',
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: 'rgb(107, 114, 128)',
                        },
                      },
                    },
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Repository Overview
              </h3>
              <div className="h-80">
                <Bar
                  data={{
                    labels: ['Pull Requests', 'Issues', 'Stars', 'Forks'],
                    datasets: [
                      {
                        label: 'Count',
                        data: [
                          repoStats.pullRequests,
                          repoStats.issues,
                          repoStats.stars,
                          repoStats.forks,
                        ],
                        backgroundColor: [
                          'rgba(54, 162, 235, 0.5)',
                          'rgba(255, 99, 132, 0.5)',
                          'rgba(255, 206, 86, 0.5)',
                          'rgba(75, 192, 192, 0.5)',
                        ],
                        borderColor: [
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 99, 132, 1)',
                          'rgba(255, 206, 86, 1)',
                          'rgba(75, 192, 192, 1)',
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          color: 'rgb(107, 114, 128)',
                        },
                      },
                      x: {
                        ticks: {
                          color: 'rgb(107, 114, 128)',
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: 'rgb(107, 114, 128)',
                        },
                      },
                    },
                  }}
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
} 
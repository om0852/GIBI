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
import { useAuth } from '@clerk/nextjs'
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
  const { getToken } = useAuth()
  const [selectedRepo, setSelectedRepo] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [savedRepos, setSavedRepos] = useState([])
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState('')
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

  // Load saved repos from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedRepos')
    if (saved) {
      setSavedRepos(JSON.parse(saved))
    }
  }, [])

  const parseGitHubUrl = (url) => {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      if (pathParts.length >= 2) {
        return `${pathParts[0]}/${pathParts[1]}`
      }
      return null
    } catch (e) {
      return null
    }
  }

  const addRepository = async () => {
    try {
      setError('')
      const repoPath = parseGitHubUrl(repoUrl)
      if (!repoPath) {
        setError('Invalid GitHub repository URL')
        return
      }

      const newRepo = {
        path: repoPath,
        url: repoUrl,
        isPrivate,
        accessToken: isPrivate ? accessToken : null,
      }

      const updatedRepos = [...savedRepos, newRepo]
      setSavedRepos(updatedRepos)
      localStorage.setItem('savedRepos', JSON.stringify(updatedRepos))

      // Clear form
      setRepoUrl('')
      setAccessToken('')
      setIsPrivate(false)
      setSelectedRepo(repoPath)
    } catch (error) {
      setError('Failed to add repository')
      console.error('Error adding repository:', error)
    }
  }

  const removeRepository = (repoPath) => {
    const updatedRepos = savedRepos.filter(repo => repo.path !== repoPath)
    setSavedRepos(updatedRepos)
    localStorage.setItem('savedRepos', JSON.stringify(updatedRepos))
    if (selectedRepo === repoPath) {
      setSelectedRepo('')
    }
  }

  useEffect(() => {
    if (selectedRepo) {
      const fetchData = async () => {
        try {
          const savedRepo = savedRepos.find(repo => repo.path === selectedRepo)
          let token = null;
          
          // Try to get token in this order: saved token -> clerk token -> undefined (for public repos)
          if (savedRepo?.isPrivate && savedRepo.accessToken) {
            token = savedRepo.accessToken;
          } else {
            try {
              token = await getToken({ template: 'github_pat' });
            } catch (e) {
              console.log('No Clerk token available, trying without token for public repo');
            }
          }

          const octokit = new Octokit({ 
            auth: token,
            userAgent: 'gibi-app v1.0'
          });

          const [owner, repo] = selectedRepo.split('/')

          console.log('Fetching data for:', owner, repo);

          // Get basic repository information first
          const repoData = await octokit.repos.get({ owner, repo });
          console.log('Repository access successful');

          // Get commit statistics with retry logic
          let commits = await octokit.repos.getCommitActivityStats({ owner, repo });
          
          // If statistics are not generated yet, try listing commits instead
          if (!commits.data || commits.data.length === 0) {
            console.log('Commit statistics not available, fetching recent commits instead');
            const recentCommits = await octokit.repos.listCommits({ 
              owner, 
              repo,
              per_page: 100 // Get last 100 commits
            });
            
            // Create weekly commit data from recent commits
            const now = new Date();
            const weeklyData = Array(12).fill(0);
            recentCommits.data.forEach(commit => {
              const commitDate = new Date(commit.commit.author.date);
              const weekIndex = Math.floor((now - commitDate) / (7 * 24 * 60 * 60 * 1000));
              if (weekIndex < 12) {
                weeklyData[weekIndex]++;
              }
            });
            
            commits = {
              data: weeklyData.map((count, index) => ({
                total: count,
                week: Math.floor(now.getTime()/1000) - ((11 - index) * 7 * 24 * 60 * 60)
              })).reverse()
            };
          }

          const [prs, issues] = await Promise.all([
            octokit.pulls.list({ owner, repo, state: 'all' }),
            octokit.issues.listForRepo({ owner, repo, state: 'all' }),
          ]);

          setRepoStats({
            commits: commits.data.reduce((acc, week) => acc + (week.total || 0), 0),
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
                data: commits.data.map((week) => week.total || 0).slice(-12),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
              },
            ],
          })
          
          setError(''); // Clear any existing errors
        } catch (error) {
          console.error('Detailed error:', error);
          let errorMessage = 'Failed to fetch repository data. ';
          
          if (error.status === 404) {
            errorMessage += 'Repository not found. Please check the URL.';
          } else if (error.status === 403) {
            errorMessage += 'Access denied. Rate limit might be exceeded or authentication required.';
          } else if (error.message?.includes('Not Found')) {
            errorMessage += 'Repository not found or you don\'t have access to it.';
          } else {
            errorMessage += error.message || 'Please check your credentials and try again.';
          }
          
          setError(errorMessage);
        }
      }

      fetchData()
    }
  }, [selectedRepo, getToken, savedRepos])

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Repository</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Private Repository
            </label>
          </div>

          {isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Personal Access Token
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          )}

          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}

          <button
            onClick={addRepository}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Repository
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">Select a repository</option>
          {savedRepos.map((repo) => (
            <option key={repo.path} value={repo.path}>
              {repo.path} {repo.isPrivate ? '(Private)' : ''}
            </option>
          ))}
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Repository Overview
                </h3>
                <button
                  onClick={() => removeRepository(selectedRepo)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove Repository
                </button>
              </div>
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
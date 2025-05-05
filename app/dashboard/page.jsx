'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Line, Bar, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useAuth } from '@clerk/nextjs'
import { useTheme } from '@/components/ThemeProvider'
import GitPlatformConnect from '@/components/GitPlatformConnect'
import { GitService } from '@/lib/gitService'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

const chartColors = {
  light: {
    primary: 'rgba(99, 102, 241, 0.8)',
    secondary: 'rgba(244, 114, 182, 0.8)',
    accent: 'rgba(34, 211, 238, 0.8)',
    success: 'rgba(52, 211, 153, 0.8)',
    warning: 'rgba(251, 191, 36, 0.8)',
    info: 'rgba(96, 165, 250, 0.8)',
    gradients: {
      blue: ['rgba(59, 130, 246, 0.8)', 'rgba(37, 99, 235, 0.1)'],
      purple: ['rgba(147, 51, 234, 0.8)', 'rgba(126, 34, 206, 0.1)'],
      pink: ['rgba(236, 72, 153, 0.8)', 'rgba(219, 39, 119, 0.1)'],
      green: ['rgba(16, 185, 129, 0.8)', 'rgba(5, 150, 105, 0.1)']
    }
  },
  dark: {
    primary: 'rgba(129, 140, 248, 0.8)',
    secondary: 'rgba(249, 168, 212, 0.8)',
    accent: 'rgba(34, 211, 238, 0.8)',
    success: 'rgba(74, 222, 128, 0.8)',
    warning: 'rgba(251, 191, 36, 0.8)',
    info: 'rgba(147, 197, 253, 0.8)',
    gradients: {
      blue: ['rgba(96, 165, 250, 0.8)', 'rgba(59, 130, 246, 0.1)'],
      purple: ['rgba(167, 139, 250, 0.8)', 'rgba(139, 92, 246, 0.1)'],
      pink: ['rgba(244, 114, 182, 0.8)', 'rgba(236, 72, 153, 0.1)'],
      green: ['rgba(52, 211, 153, 0.8)', 'rgba(16, 185, 129, 0.1)']
    }
  }
};

const getChartConfig = (isDark) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart'
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(156, 163, 175, 0.1)',
        drawBorder: false,
      },
      ticks: {
        color: isDark ? 'rgb(209, 213, 219)' : 'rgb(107, 114, 128)',
        padding: 10,
        font: { size: 12 }
      }
    },
    x: {
      grid: { display: false },
      ticks: {
        color: isDark ? 'rgb(209, 213, 219)' : 'rgb(107, 114, 128)',
        padding: 5,
        font: { size: 12 },
        maxRotation: 0
      }
    }
  },
  plugins: {
    legend: {
      labels: {
        color: isDark ? 'rgb(209, 213, 219)' : 'rgb(107, 114, 128)',
        font: { size: 12, weight: '500' },
        padding: 15,
        usePointStyle: true
      }
    },
    tooltip: {
      backgroundColor: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(17, 24, 39, 0.8)',
      titleColor: isDark ? 'rgb(243, 244, 246)' : 'rgb(255, 255, 255)',
      bodyColor: isDark ? 'rgb(209, 213, 219)' : 'rgb(209, 213, 219)',
      padding: 12,
      borderColor: isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      displayColors: true,
      usePointStyle: true,
      callbacks: {
        label: function(context) {
          return `${context.dataset.label}: ${context.parsed.y}`;
        }
      }
    }
  }
});

export default function DashboardPage() {
  const { getToken } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [connections, setConnections] = useState([])
  const [repositories, setRepositories] = useState([])
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [compareRepo, setCompareRepo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [repoStats, setRepoStats] = useState({
    commits: 0,
    pullRequests: 0,
    issues: 0,
    stars: 0,
    forks: 0,
    lastCommit: null
  })
  const [compareStats, setCompareStats] = useState(null)
  const [commitData, setCommitData] = useState({
    labels: [],
    datasets: []
  })
  const [contributionData, setContributionData] = useState({
    contributions: [],
    totalContributions: 0
  });

  // Handle GitHub OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectionData = params.get('connection');
    const errorMessage = params.get('error');

    if (connectionData) {
      try {
        const connection = JSON.parse(decodeURIComponent(connectionData));
        const existingConnections = JSON.parse(localStorage.getItem('gitConnections') || '[]');
        const updatedConnections = [...existingConnections.filter(c => c.platform !== connection.platform), connection];
        localStorage.setItem('gitConnections', JSON.stringify(updatedConnections));
        setConnections(updatedConnections);
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
      } catch (err) {
        console.error('Error processing connection data:', err);
        setError('Failed to process connection data');
      }
    }

    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  // Load connections from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gitConnections')
    if (saved) {
      setConnections(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  // Fetch repositories when connections change
  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setLoading(true)
        const allRepos = [];

        for (const connection of connections) {
          const service = GitService.create(connection.platform, connection.token);
          const repos = await service.listRepositories();
          allRepos.push(...repos);
        }

        setRepositories(allRepos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        setError('');
      } catch (err) {
        console.error('Error fetching repositories:', err);
        setError('Failed to fetch repositories. Please check your connections.');
      } finally {
        setLoading(false);
      }
    };

    if (connections.length > 0) {
      fetchRepositories();
    }
  }, [connections]);

  // Add new useEffect for fetching all contributions
  useEffect(() => {
    const fetchAllContributions = async () => {
      if (connections.length === 0) return;

      try {
        setLoading(true);
        const githubConnection = connections.find(c => c.platform === 'GITHUB');
        
        if (githubConnection) {
          const service = GitService.create('GITHUB', githubConnection.token);
          
          // Get all repositories first
          const repos = await service.listRepositories();
          
          // Initialize contribution map for the last year
          const contributionMap = new Map();
          const now = new Date();
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          
          // Initialize all dates with 0 contributions
          for (let d = new Date(yearAgo); d <= now; d.setDate(d.getDate() + 1)) {
            contributionMap.set(d.toISOString().split('T')[0], 0);
          }

          // Fetch commit activity for each repository and aggregate
          for (const repo of repos) {
            try {
              const [owner, repoName] = repo.fullName.split('/');
              const stats = await service.getRepositoryStats(owner, repoName);
              
              if (stats.commitActivity) {
                stats.commitActivity.forEach(week => {
                  const weekStart = new Date(week.week * 1000);
                  const total = week.total || 0;
                  const dailyAverage = Math.floor(total / 7);
                  
                  // Distribute commits across the week
                  for (let i = 0; i < 7; i++) {
                    const date = new Date(weekStart);
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    if (contributionMap.has(dateStr)) {
                      contributionMap.set(dateStr, (contributionMap.get(dateStr) || 0) + dailyAverage);
                    }
                  }
                });
              }
            } catch (error) {
              console.warn(`Failed to fetch stats for ${repo.fullName}:`, error);
            }
          }

          // Convert map to array and sort by date
          const contributions = Array.from(contributionMap.entries()).map(([date, count]) => ({
            date,
            count
          })).sort((a, b) => a.date.localeCompare(b.date));

          setContributionData({
            contributions,
            totalContributions: contributions.reduce((sum, day) => sum + day.count, 0)
          });
        }
      } catch (error) {
        console.error('Error fetching all contributions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllContributions();
  }, [connections]);

  // Remove contribution fetching from the repository stats useEffect
  useEffect(() => {
    const fetchStats = async (repo, setStats) => {
      if (!repo) return;

      try {
        setLoading(true);
        const connection = connections.find(c => c.platform === repo.platform);
        if (!connection) {
          throw new Error('Platform connection not found');
        }

        const service = GitService.create(connection.platform, connection.token);
        let stats;

        switch (repo.platform) {
          case 'GITHUB':
            const [owner, repoName] = repo.fullName.split('/');
            stats = await service.getRepositoryStats(owner, repoName);
            break;
          case 'GITLAB':
            stats = await service.getRepositoryStats(repo.id);
            break;
          case 'BITBUCKET':
            const [workspace, repoSlug] = repo.fullName.split('/');
            stats = await service.getRepositoryStats(workspace, repoSlug);
            break;
        }

        setStats({
          ...stats,
          platform: repo.platform
        });

        setError('');
      } catch (err) {
        console.error('Error fetching repository stats:', err);
        setError('Failed to fetch repository statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats(selectedRepo, setRepoStats);
    if (compareRepo) {
      fetchStats(compareRepo, setCompareStats);
    }
  }, [selectedRepo, compareRepo, connections]);

  // Update chart when comparing repositories
  useEffect(() => {
    if (selectedRepo && compareRepo && repoStats && compareStats) {
      const labels = repoStats.commitActivity.map((week) => {
        const date = new Date(week.week * 1000);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      setCommitData({
        labels,
        datasets: [
          {
            label: `${selectedRepo.name} Commits`,
            data: repoStats.commitActivity.map(week => week.total),
            borderColor: chartColors.light.gradients.blue[0],
            backgroundColor: chartColors.light.gradients.blue[1],
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: `${compareRepo.name} Commits`,
            data: compareStats.commitActivity.map(week => week.total),
            borderColor: chartColors.light.gradients.purple[0],
            backgroundColor: chartColors.light.gradients.purple[1],
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          }
        ]
      });
    }
  }, [selectedRepo, compareRepo, repoStats, compareStats]);

  const handleConnect = (connection) => {
    setConnections(prev => [...prev.filter(c => c.platform !== connection.platform), connection]);
  };

  const handleDisconnect = (platform) => {
    setConnections(prev => prev.filter(c => c.platform !== platform));
    localStorage.setItem('gitConnections', JSON.stringify(connections.filter(c => c.platform !== platform)));
    if (selectedRepo?.platform === platform) {
      setSelectedRepo(null);
    }
  };

  // Update chart colors based on theme
  const currentChartColors = theme === 'dark' ? chartColors.dark : chartColors.light;
  const chartConfig = getChartConfig(theme === 'dark');

  const ContributionGraph = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getContributionLevel = (count) => {
      if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
      if (count <= 3) return 'bg-green-100 dark:bg-green-900';
      if (count <= 6) return 'bg-green-300 dark:bg-green-700';
      if (count <= 9) return 'bg-green-500 dark:bg-green-500';
      return 'bg-green-700 dark:bg-green-300';
    };

    const getMonthLabels = () => {
      const labels = [];
      if (contributionData.contributions.length > 0) {
        const firstDate = new Date(contributionData.contributions[0].date);
        const lastDate = new Date(contributionData.contributions[contributionData.contributions.length - 1].date);
        
        for (let date = new Date(firstDate); date <= lastDate; date.setDate(1)) {
          if (date.getDate() === 1) {
            labels.push({
              month: months[date.getMonth()],
              offset: Math.floor(date.getDay()) // No need to adjust for Sunday start
            });
          }
          date.setMonth(date.getMonth() + 1);
        }
      }
      return labels;
    };

    // Group contributions by week
    const weeks = [];
    let currentWeek = [];
    contributionData.contributions.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
      
      // Push the last week
      if (index === contributionData.contributions.length - 1) {
        weeks.push(currentWeek);
      }
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Contribution Activity
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {contributionData.totalContributions} contributions in the last year
          </span>
        </div>
        
        <div className="flex">
          <div className="grid grid-rows-7 gap-[3px] text-xs text-gray-500 dark:text-gray-400 mr-2">
            {days.map(day => (
              <span key={day} className="h-[10px] flex items-center">{day}</span>
            ))}
          </div>
          
          <div className="relative flex-1">
            <div className="flex mb-2 text-xs text-gray-500 dark:text-gray-400">
              {getMonthLabels().map((label, i) => (
                <span
                  key={i}
                  className="flex-1 text-center"
                  style={{ marginLeft: i === 0 ? `${label.offset * 12}px` : '0' }}
                >
                  {label.month}
                </span>
              ))}
            </div>
            
            <div className="grid grid-flow-col gap-[3px] auto-cols-fr">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-rows-7 gap-[3px]">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const day = week[dayIndex];
                    return (
                      <div
                        key={dayIndex}
                        className={`w-[10px] h-[10px] rounded-sm ${
                          day ? getContributionLevel(day.count) : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                        title={day ? `${day.count} contributions on ${day.date}` : 'No contributions'}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end mt-4 space-x-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Less</span>
          {[0, 3, 6, 9, 12].map(level => (
            <div
              key={level}
              className={`w-[10px] h-[10px] rounded-sm ${getContributionLevel(level)}`}
            />
          ))}
          <span className="text-gray-500 dark:text-gray-400">More</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>
      </div>

      <GitPlatformConnect onConnect={handleConnect} />

      {connections.length > 0 && (
        <>
          <ContributionGraph />

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Repository
                </label>
                <select
                  value={selectedRepo ? `${selectedRepo.platform}:${selectedRepo.fullName}` : ''}
                  onChange={(e) => {
                    const [platform, fullName] = e.target.value.split(':');
                    setSelectedRepo(repositories.find(r => r.platform === platform && r.fullName === fullName));
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select a repository</option>
                  {repositories.map((repo) => (
                    <option key={`${repo.platform}:${repo.fullName}`} value={`${repo.platform}:${repo.fullName}`}>
                      {repo.platform} - {repo.fullName} {repo.isPrivate ? '🔒' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compare With (Optional)
                </label>
                <select
                  value={compareRepo ? `${compareRepo.platform}:${compareRepo.fullName}` : ''}
                  onChange={(e) => {
                    const [platform, fullName] = e.target.value.split(':');
                    setCompareRepo(e.target.value ? repositories.find(r => r.platform === platform && r.fullName === fullName) : null);
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select a repository to compare</option>
                  {repositories
                    .filter(repo => repo !== selectedRepo)
                    .map((repo) => (
                      <option key={`${repo.platform}:${repo.fullName}`} value={`${repo.platform}:${repo.fullName}`}>
                        {repo.platform} - {repo.fullName} {repo.isPrivate ? '🔒' : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {selectedRepo && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {[
                    { label: 'Commits', value: repoStats.commits, icon: '📝', color: 'blue' },
                    { label: 'Pull Requests', value: repoStats.pullRequests, icon: '🔄', color: 'purple' },
                    { label: 'Issues', value: repoStats.issues, icon: '⚠️', color: 'yellow' },
                    { label: 'Stars', value: repoStats.stars, icon: '⭐', color: 'amber' },
                    { label: 'Forks', value: repoStats.forks, icon: '🔱', color: 'green' }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/5 
                                border border-${stat.color}-200 dark:border-${stat.color}-800 
                                rounded-lg shadow-lg overflow-hidden`}
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 text-2xl">{stat.icon}</div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                {stat.label}
                              </dt>
                              <dd className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                  {stat.value}
                                </div>
                                {compareStats && (
                                  <div className={`ml-2 text-sm font-medium ${
                                    stat.value > compareStats[stat.label.toLowerCase().replace(' ', '')] 
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {stat.value > compareStats[stat.label.toLowerCase().replace(' ', '')] ? '↑' : '↓'}
                                  </div>
                                )}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Commit Activity
                  </h3>
                  <div className="h-96">
                    <Line
                      data={commitData}
                      options={{
                        ...chartConfig,
                        interaction: {
                          mode: 'nearest',
                          axis: 'x',
                          intersect: false
                        }
                      }}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Repository Comparison
                    </h3>
                    <div className="flex items-center space-x-4">
                      <a
                        href={selectedRepo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Repository →
                      </a>
                    </div>
                  </div>
                  <div className="h-96">
                    <Radar
                      data={{
                        labels: ['Commits', 'Pull Requests', 'Issues', 'Stars', 'Forks'],
                        datasets: [
                          {
                            label: selectedRepo.name,
                            data: [
                              repoStats.commits,
                              repoStats.pullRequests,
                              repoStats.issues,
                              repoStats.stars,
                              repoStats.forks
                            ],
                            backgroundColor: currentChartColors.gradients.blue[1],
                            borderColor: currentChartColors.gradients.blue[0],
                            borderWidth: 2,
                          },
                          compareRepo && {
                            label: compareRepo.name,
                            data: [
                              compareStats?.commits || 0,
                              compareStats?.pullRequests || 0,
                              compareStats?.issues || 0,
                              compareStats?.stars || 0,
                              compareStats?.forks || 0
                            ],
                            backgroundColor: currentChartColors.gradients.purple[1],
                            borderColor: currentChartColors.gradients.purple[0],
                            borderWidth: 2,
                          }
                        ].filter(Boolean)
                      }}
                      options={chartConfig}
                    />
                  </div>
                </motion.div>

                {repoStats.lastCommit && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Latest Commit
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {repoStats.lastCommit.message}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            by {repoStats.lastCommit.author} • {new Date(repoStats.lastCommit.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-400 p-4 rounded-lg"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              ⚠️
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-200">
                {error}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
} 
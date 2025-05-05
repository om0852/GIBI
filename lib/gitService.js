import { Octokit } from '@octokit/rest';

export class GitService {
  constructor(platform, token) {
    this.platform = platform;
    this.token = token;
  }

  static create(platform, token) {
    switch (platform) {
      case 'GITHUB':
        return new GitHubService(token);
      case 'GITLAB':
        return new GitLabService(token);
      case 'BITBUCKET':
        return new BitbucketService(token);
      default:
        throw new Error('Unsupported platform');
    }
  }
}

class GitHubService extends GitService {
  constructor(token) {
    super('GITHUB', token);
    this.client = new Octokit({ 
      auth: token,
      request: {
        timeout: 5000 // 5 second timeout
      }
    });
  }

  async listRepositories() {
    try {
      const repos = await this.client.paginate(this.client.repos.listForAuthenticatedUser, {
        sort: 'updated',
        per_page: 100,
      });

      return repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        isPrivate: repo.private,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        updatedAt: repo.updated_at,
        platform: 'GITHUB'
      }));
    } catch (error) {
      console.error('Error listing repositories:', error);
      throw new Error(`Failed to list repositories: ${error.message}`);
    }
  }

  async getRepositoryStats(owner, repo) {
    try {
      // Get basic repo data first
      let repoData;
      try {
        repoData = await this.client.repos.get({ owner, repo });
      } catch (error) {
        throw new Error(`Repository not found or access denied: ${owner}/${repo}`);
      }

      // Initialize default stats
      const stats = {
        commits: 0,
        pullRequests: 0,
        issues: 0,
        stars: repoData.data.stargazers_count,
        forks: repoData.data.forks_count,
        commitActivity: []
      };

      // Fetch commit activity with retry logic
      let commitActivity = null;
      let retries = 3;
      
      while (retries > 0 && !commitActivity) {
        try {
          const response = await this.client.repos.getCommitActivityStats({ owner, repo });
          
          // Check if GitHub is still calculating statistics
          if (response.status === 202) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries--;
            continue;
          }

          if (response.data) {
            commitActivity = response.data;
            break;
          }
        } catch (error) {
          if (error.status === 403) {
            throw new Error('API rate limit exceeded. Please try again later.');
          }
          console.warn(`Retry ${3 - retries} failed for commit activity:`, error.message);
          retries--;
        }
      }

      // If we couldn't get commit activity, try fallback method
      if (!commitActivity) {
        try {
          // Try to get at least the last 100 commits
          const commits = await this.client.repos.listCommits({
            owner,
            repo,
            per_page: 100,
            sort: 'created',
            direction: 'desc'
          });

          if (commits.data.length > 0) {
            // Create weekly commit activity from available commits
            const weekMap = new Map();
            const oldestCommit = new Date(commits.data[commits.data.length - 1].commit.author.date);
            const newestCommit = new Date(commits.data[0].commit.author.date);
            const weekSpan = Math.ceil((newestCommit - oldestCommit) / (7 * 24 * 60 * 60 * 1000));

            // Initialize all weeks with 0 commits
            for (let i = 0; i < weekSpan; i++) {
              const weekTime = newestCommit.getTime() - (i * 7 * 24 * 60 * 60 * 1000);
              weekMap.set(Math.floor(weekTime / (7 * 24 * 60 * 60 * 1000)), 0);
            }

            // Count commits per week
            commits.data.forEach(commit => {
              const date = new Date(commit.commit.author.date);
              const week = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
              weekMap.set(week, (weekMap.get(week) || 0) + 1);
            });

            stats.commits = commits.data.length;
            stats.commitActivity = Array.from(weekMap)
              .map(([week, total]) => ({
                week: week * 7 * 24 * 60 * 60,
                total
              }))
              .sort((a, b) => a.week - b.week);
          }
        } catch (error) {
          console.warn('Fallback commit fetching failed:', error);
          // If even fallback fails, use empty commit activity
          stats.commitActivity = Array(12).fill({ total: 0 });
        }
      } else {
        stats.commits = commitActivity.reduce((acc, week) => acc + (week.total || 0), 0);
        stats.commitActivity = commitActivity;
      }

      // Fetch PRs and issues in parallel with individual error handling
      const [prs, issues] = await Promise.all([
        this.client.pulls.list({ owner, repo, state: 'all', per_page: 100 })
          .then(response => response.data)
          .catch(error => {
            console.warn('Failed to fetch pull requests:', error);
            return [];
          }),
        this.client.issues.listForRepo({ owner, repo, state: 'all', per_page: 100 })
          .then(response => response.data)
          .catch(error => {
            console.warn('Failed to fetch issues:', error);
            return [];
          })
      ]);

      stats.pullRequests = prs.length;
      stats.issues = issues.filter(issue => !issue.pull_request).length;

      return stats;
    } catch (error) {
      console.error('Error fetching repository stats:', error);
      if (error.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}`);
      } else if (error.status === 403) {
        throw new Error('API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Failed to fetch stats for ${owner}/${repo}: ${error.message}`);
      }
    }
  }
}

class GitLabService extends GitService {
  constructor(token) {
    super('GITLAB', token);
    this.baseUrl = 'https://gitlab.com/api/v4';
  }

  async listRepositories() {
    const response = await fetch(`${this.baseUrl}/projects?membership=true&per_page=100`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitLab repositories');
    }

    const repos = await response.json();
    return repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.path_with_namespace,
      description: repo.description,
      isPrivate: !repo.public,
      url: repo.web_url,
      defaultBranch: repo.default_branch,
      stars: repo.star_count,
      forks: repo.forks_count,
      updatedAt: repo.last_activity_at,
      platform: 'GITLAB'
    }));
  }

  async getRepositoryStats(projectId) {
    const [commits, mergeRequests] = await Promise.all([
      fetch(`${this.baseUrl}/projects/${projectId}/repository/commits?per_page=100`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }).then(res => res.json()),
      fetch(`${this.baseUrl}/projects/${projectId}/merge_requests?per_page=100`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }).then(res => res.json())
    ]);

    // Group commits by week
    const weeklyCommits = commits.reduce((acc, commit) => {
      const week = Math.floor(new Date(commit.created_at).getTime() / (7 * 24 * 60 * 60 * 1000));
      acc[week] = (acc[week] || 0) + 1;
      return acc;
    }, {});

    return {
      commits: commits.length,
      pullRequests: mergeRequests.length,
      issues: 0, // Requires additional API call if needed
      stars: 0, // Requires additional API call if needed
      forks: 0, // Requires additional API call if needed
      commitActivity: Object.entries(weeklyCommits).map(([week, count]) => ({
        week: week * 7 * 24 * 60 * 60,
        total: count
      })).slice(-12)
    };
  }
}

class BitbucketService extends GitService {
  constructor(token) {
    super('BITBUCKET', token);
    this.baseUrl = 'https://api.bitbucket.org/2.0';
  }

  async listRepositories() {
    const response = await fetch(`${this.baseUrl}/repositories?role=member`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Bitbucket repositories');
    }

    const data = await response.json();
    return data.values.map(repo => ({
      id: repo.uuid,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      isPrivate: repo.is_private,
      url: repo.links.html.href,
      defaultBranch: repo.mainbranch?.name,
      updatedAt: repo.updated_on,
      platform: 'BITBUCKET'
    }));
  }

  async getRepositoryStats(workspace, repoSlug) {
    try {
      const [commits, pullRequests] = await Promise.all([
        fetch(`${this.baseUrl}/repositories/${workspace}/${repoSlug}/commits`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        }).then(res => {
          if (!res.ok) throw new Error('Failed to fetch commits');
          return res.json();
        }),
        fetch(`${this.baseUrl}/repositories/${workspace}/${repoSlug}/pullrequests`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        }).then(res => {
          if (!res.ok) throw new Error('Failed to fetch pull requests');
          return res.json();
        })
      ]);

      // Group commits by week
      const weeklyCommits = commits.values.reduce((acc, commit) => {
        const week = Math.floor(new Date(commit.date).getTime() / (7 * 24 * 60 * 60 * 1000));
        acc[week] = (acc[week] || 0) + 1;
        return acc;
      }, {});

      // Sort weeks and take last 12 weeks
      const sortedWeeks = Object.entries(weeklyCommits)
        .sort(([weekA], [weekB]) => weekA - weekB)
        .slice(-12);

      return {
        commits: commits.values.length,
        pullRequests: pullRequests.size,
        issues: 0, // Bitbucket API doesn't have direct issues endpoint
        stars: 0, // Bitbucket doesn't have stars
        forks: 0, // Would need additional API call
        commitActivity: sortedWeeks.map(([week, count]) => ({
          week: parseInt(week) * 7 * 24 * 60 * 60,
          total: count
        }))
      };
    } catch (error) {
      console.error('Error fetching Bitbucket stats:', error);
      throw new Error(`Failed to fetch stats for ${workspace}/${repoSlug}: ${error.message}`);
    }
  }
}
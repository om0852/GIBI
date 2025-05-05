import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { z } from 'zod'

const querySchema = z.object({
  repo: z.string().regex(/^[a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+$/),
  token: z.string().optional(),
})

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const validatedParams = querySchema.parse({
      repo: searchParams.get('repo'),
      token: searchParams.get('token'),
    })

    const octokit = new Octokit({
      auth: validatedParams.token,
    })

    const [owner, repo] = validatedParams.repo.split('/')

    // Fetch repository data in parallel
    const [
      repoData,
      commits,
      contributors,
      languages,
      pullRequests,
      issues,
    ] = await Promise.all([
      octokit.repos.get({ owner, repo }),
      octokit.repos.getCommitActivityStats({ owner, repo }),
      octokit.repos.getContributorsStats({ owner, repo }),
      octokit.repos.listLanguages({ owner, repo }),
      octokit.pulls.list({ owner, repo, state: 'all', per_page: 100 }),
      octokit.issues.listForRepo({ owner, repo, state: 'all', per_page: 100 }),
    ])

    // Calculate AI-estimated metrics
    const totalCommits = commits.data?.reduce((acc, week) => acc + week.total, 0) || 0
    const averageCommitsPerWeek = totalCommits / (commits.data?.length || 1)
    const estimatedHoursWorked = totalCommits * 2.5 // Rough estimate: 2.5 hours per commit

    // Process contributor data with AI-generated skill scores
    const contributorStats = contributors.data?.map((contributor) => {
      const totalAdditions = contributor.weeks.reduce((acc, week) => acc + week.a, 0)
      const totalDeletions = contributor.weeks.reduce((acc, week) => acc + week.d, 0)
      const totalCommits = contributor.weeks.reduce((acc, week) => acc + week.c, 0)
      
      // Calculate skill score based on commit frequency and impact
      const commitImpact = (totalAdditions + totalDeletions) / (totalCommits || 1)
      const skillScore = Math.min(
        10,
        Math.round((
          (totalCommits * 0.4) + // Weight for number of commits
          (commitImpact * 0.3) + // Weight for code impact
          (contributor.weeks.length * 0.3) // Weight for contribution duration
        ) * 10) / 10
      )

      return {
        username: contributor.author.login,
        avatarUrl: contributor.author.avatar_url,
        totalCommits,
        totalAdditions,
        totalDeletions,
        skillScore,
        contributionPeriod: `${contributor.weeks.length} weeks`,
      }
    }) || []

    // Calculate language proficiency
    const totalBytes = Object.values(languages.data).reduce((a, b) => a + b, 0)
    const languageStats = Object.entries(languages.data).map(([language, bytes]) => ({
      language,
      percentage: Math.round((bytes / totalBytes) * 1000) / 10,
    }))

    return NextResponse.json({
      repository: {
        name: repoData.data.name,
        fullName: repoData.data.full_name,
        description: repoData.data.description,
        stars: repoData.data.stargazers_count,
        forks: repoData.data.forks_count,
        watchers: repoData.data.watchers_count,
        openIssues: repoData.data.open_issues_count,
        createdAt: repoData.data.created_at,
        updatedAt: repoData.data.updated_at,
      },
      statistics: {
        totalCommits,
        averageCommitsPerWeek,
        pullRequests: pullRequests.data.length,
        openPullRequests: pullRequests.data.filter(pr => pr.state === 'open').length,
        issues: issues.data.length,
        openIssues: issues.data.filter(issue => issue.state === 'open').length,
        estimatedHoursWorked,
      },
      contributors: contributorStats,
      languages: languageStats,
      commitActivity: commits.data?.map(week => ({
        week: new Date(week.week * 1000).toISOString(),
        total: week.total,
        days: week.days,
      })) || [],
    })
  } catch (error) {
    console.error('Error analyzing repository:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to analyze repository' },
      { status: 500 }
    )
  }
} 
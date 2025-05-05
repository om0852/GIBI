'use client';

import { useState } from 'react';

const PLATFORMS = {
  GITHUB: {
    name: 'GitHub',
    icon: '🐱',
    tokenUrl: 'https://github.com/settings/tokens',
    scopes: ['repo', 'read:user', 'read:org'],
    placeholder: 'ghp_xxxxxxxxxxxx'
  },
  GITLAB: {
    name: 'GitLab',
    icon: '🦊',
    tokenUrl: 'https://gitlab.com/-/profile/personal_access_tokens',
    scopes: ['read_api', 'read_repository', 'read_user'],
    placeholder: 'glpat-xxxxxxxxxxxx'
  },
  BITBUCKET: {
    name: 'Bitbucket',
    icon: '🪣',
    tokenUrl: 'https://bitbucket.org/account/settings/app-passwords/',
    scopes: ['repository:read', 'account:read'],
    placeholder: 'BITBUCKET_TOKEN'
  }
};

const GITHUB_CLIENT_ID = 'Ov23liDJ0R2V9daP0SQy';

export default function GitPlatformConnect({ onConnect }) {
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setError('');
      setConnecting(true);

      if (!selectedPlatform) {
        setError('Please select a platform');
        return;
      }

      if (!accessToken) {
        setError('Please enter an access token');
        return;
      }

      // Test the connection before saving
      const platform = PLATFORMS[selectedPlatform];
      let userData;

      switch (selectedPlatform) {
        case 'GITHUB':
          userData = await testGitHubConnection(accessToken);
          break;
        case 'GITLAB':
          userData = await testGitLabConnection(accessToken);
          break;
        case 'BITBUCKET':
          userData = await testBitbucketConnection(accessToken);
          break;
      }

      // Save the connection
      const connection = {
        platform: selectedPlatform,
        token: accessToken,
        userData,
        connected: true,
        connectedAt: new Date().toISOString()
      };

      // Save to localStorage
      const connections = JSON.parse(localStorage.getItem('gitConnections') || '[]');
      const updatedConnections = [...connections.filter(c => c.platform !== selectedPlatform), connection];
      localStorage.setItem('gitConnections', JSON.stringify(updatedConnections));

      // Notify parent
      onConnect(connection);

      // Reset form
      setSelectedPlatform('');
      setAccessToken('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to connect. Please check your token and try again.');
    } finally {
      setConnecting(false);
    }
  };

  const testGitHubConnection = async (token) => {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Invalid GitHub token');
    }

    return await response.json();
  };

  const testGitLabConnection = async (token) => {
    const response = await fetch('https://gitlab.com/api/v4/user', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Invalid GitLab token');
    }

    return await response.json();
  };

  const testBitbucketConnection = async (token) => {
    const response = await fetch('https://api.bitbucket.org/2.0/user', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Invalid Bitbucket token');
    }

    return await response.json();
  };

  const handleGitHubAuth = () => {
    const redirectUri = `${window.location.origin}/api/auth/github/callback`;
    const scope = 'repo read:user read:org';
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = authUrl;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Connect Git Platform
      </h2>
      <div className="space-y-4">
        <button
          onClick={handleGitHubAuth}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <span>🐱</span>
          Connect with GitHub
        </button>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Platform
          </label>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select a platform</option>
            {Object.entries(PLATFORMS).map(([key, platform]) => (
              <option key={key} value={key}>
                {platform.icon} {platform.name}
              </option>
            ))}
          </select>
        </div>

        {selectedPlatform && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Access Token
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={PLATFORMS[selectedPlatform].placeholder}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Create a token with these scopes: {PLATFORMS[selectedPlatform].scopes.join(', ')}
                <a
                  href={PLATFORMS[selectedPlatform].tokenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-500 hover:text-blue-600 dark:text-blue-400"
                >
                  Get token →
                </a>
              </p>
            </div>

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? 'Connecting...' : 'Connect Platform'}
            </button>
          </>
        )}
      </div>
    </div>
  );
} 
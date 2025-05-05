'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';

export default function HomePage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  if (isLoaded && userId) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <nav className="fixed w-full bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gibi</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                {theme === 'dark' ? '🌞' : '🌙'}
              </button>
              <button
                onClick={() => router.push('/sign-in')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block">Welcome to Gibi</span>
              <span className="block text-blue-600">GitHub Analytics Made Simple</span>
            </h2>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Track your GitHub repositories, analyze commit patterns, and get insights into your development workflow.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <button
                  onClick={() => router.push('/sign-up')}
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Repository Analytics',
                  description: 'Get detailed insights into your repository performance and activity.',
                  icon: '📊'
                },
                {
                  title: 'Commit Tracking',
                  description: 'Track commit patterns and team contribution statistics.',
                  icon: '📈'
                },
                {
                  title: 'Issue Management',
                  description: 'Monitor issues and pull requests with comprehensive analytics.',
                  icon: '🎯'
                }
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
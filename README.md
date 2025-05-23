# Gibi - GitHub Analytics Platform

Gibi is a powerful GitHub repository analytics platform that provides insights into repository metrics, contributor performance, and code quality using AI-powered analysis.

## 🚀 Features

- **Repository Analytics**
  - Commit history and trends
  - Pull request and issue tracking
  - Code contribution metrics
  - Repository activity timeline

- **Contributor Insights**
  - AI-generated skill ratings
  - Individual contribution statistics
  - Language proficiency analysis
  - Activity patterns and trends

- **Visualization**
  - Interactive charts and graphs
  - Contribution timeline
  - Language distribution
  - Performance metrics

- **API Access**
  - RESTful API endpoints
  - Comprehensive repository analysis
  - Contributor performance metrics
  - Secure token authentication

## 🛠 Tech Stack

- Next.js 14
- TypeScript
- TailwindCSS
- Framer Motion
- Chart.js
- GitHub API (REST & GraphQL)

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gibi.git
   cd gibi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set the homepage URL to `http://localhost:3000`
   - Set the callback URL to `http://localhost:3000/api/auth/callback/github`

4. Create `.env.local` file:
   ```env
   GITHUB_ID=your_github_oauth_app_id
   GITHUB_SECRET=your_github_oauth_app_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret # Generate with: openssl rand -base64 32
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔒 Authentication

Gibi uses GitHub OAuth for authentication. Users can:
- Sign in with their GitHub account
- Access private repositories
- View organization-wide analytics
- Generate API tokens

## 📊 API Usage

The analytics API can be accessed at `/api/github/analyze`:

```typescript
// Example API request
const response = await fetch('/api/github/analyze?repo=owner/repo', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

Response includes:
- Repository metrics
- Contributor statistics
- Language analysis
- AI-generated insights

## 🎨 Customization

Users can customize:
- Dashboard layout
- Metrics display
- Theme (light/dark)
- Data visualization

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
#   G I B I  
 
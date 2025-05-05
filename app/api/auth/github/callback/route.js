import { NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = 'Ov23liDJ0R2V9daP0SQy';
const GITHUB_CLIENT_SECRET = '4eb0aa704e596663074a5665c5f9fd5bb808c7f8';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    // Get user data
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
      },
    });

    const userData = await userResponse.json();

    // Store connection in localStorage
    const connection = {
      platform: 'GITHUB',
      token: tokenData.access_token,
      userData,
      connected: true,
      connectedAt: new Date().toISOString(),
    };

    // Redirect back to dashboard with success
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?connection=${encodeURIComponent(JSON.stringify(connection))}`);
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?error=${encodeURIComponent(error.message)}`);
  }
} 
"use node";
// convex/authTauri.ts
// OAuth code exchange for Tauri mobile deep links

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Allowed redirect URIs for OAuth code exchange.
 * Prevents open redirect attacks by rejecting any URI not in this list.
 */
const ALLOWED_REDIRECT_URIS = [
  "astn://auth/callback", // Tauri mobile deep link
  // Web callback URLs added via env var for flexibility
];

/**
 * Exchange OAuth authorization code for tokens (Tauri mobile flow)
 *
 * This handles the code exchange that @convex-dev/auth normally does
 * internally for web flows. For Tauri deep links, we need to do it manually.
 *
 * // TODO: Post-pilot - stop returning raw tokens to client, handle session server-side
 */
export const exchangeOAuthCode = action({
  args: {
    code: v.string(),
    provider: v.union(v.literal("github"), v.literal("google")),
    redirectUri: v.string(),
    codeVerifier: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { code, provider, redirectUri, codeVerifier } = args;

    // Validate redirectUri against allowlist
    const webRedirectUri = process.env.AUTH_REDIRECT_URI_WEB;
    const allowedUris = [...ALLOWED_REDIRECT_URIS];
    if (webRedirectUri) allowedUris.push(webRedirectUri);
    if (!allowedUris.includes(redirectUri)) {
      throw new Error("Invalid redirect URI");
    }

    if (provider === "github") {
      return exchangeGitHubCode(code, redirectUri, codeVerifier);
    } else if (provider === "google") {
      return exchangeGoogleCode(code, redirectUri, codeVerifier);
    }

    throw new Error(`Unsupported provider: ${provider}`);
  },
});

async function exchangeGitHubCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string
) {
  // Use mobile-specific OAuth app for Tauri deep links
  const isMobile = redirectUri.startsWith("astn://");
  const clientId = isMobile
    ? process.env.AUTH_GITHUB_ID_MOBILE
    : process.env.AUTH_GITHUB_ID;
  const clientSecret = isMobile
    ? process.env.AUTH_GITHUB_SECRET_MOBILE
    : process.env.AUTH_GITHUB_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      `GitHub OAuth credentials not configured for ${isMobile ? "mobile" : "web"}`
    );
  }

  const body: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  };
  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub token exchange failed: ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `GitHub OAuth error: ${data.error_description || data.error}`
    );
  }

  // Get user info with the access token
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${data.access_token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch GitHub user info");
  }

  const user = await userResponse.json();

  // Get user email (may be separate API call if email is private)
  let email = user.email;
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      const primary = emails.find((e: { primary: boolean }) => e.primary);
      email = primary?.email || emails[0]?.email;
    }
  }

  return {
    provider: "github" as const,
    accessToken: data.access_token,
    user: {
      id: String(user.id),
      email,
      name: user.name || user.login,
      image: user.avatar_url,
    },
  };
}

async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string
) {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const params: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };
  if (codeVerifier) {
    params.code_verifier = codeVerifier;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `Google OAuth error: ${data.error_description || data.error}`
    );
  }

  // Get user info with the access token
  const userResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    }
  );

  if (!userResponse.ok) {
    throw new Error("Failed to fetch Google user info");
  }

  const user = await userResponse.json();

  return {
    provider: "google" as const,
    accessToken: data.access_token,
    idToken: data.id_token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.picture,
    },
  };
}

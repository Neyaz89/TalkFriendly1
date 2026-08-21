import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "czdltlqhmeqyvogomqxt.supabase.co",
      },
    ],
  },

  // Make API base URL available server-side too
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
    NEXT_PUBLIC_APP_NAME: "TalkFriendly",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },

  // Suppress the "you imported a component that needs next/dynamic" warning for recharts
  webpack(config) {
    return config;
  },
};

export default nextConfig;

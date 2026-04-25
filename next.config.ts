import type { NextConfig } from "next";

/** Allow Next/Image to fetch the same Storage host as NEXT_PUBLIC_SUPABASE_URL (any ref or custom domain). */
function supabaseStorageRemotePatterns(): {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
}[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return [];
  try {
    const u = new URL(raw);
    const entry: {
      protocol: "http" | "https";
      hostname: string;
      port?: string;
      pathname: string;
    } = {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      pathname: "/storage/v1/object/public/**",
    };
    if (u.port) entry.port = u.port;
    return [entry];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  poweredByHeader: false,
  images: {
    remotePatterns: [
      ...supabaseStorageRemotePatterns(),
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

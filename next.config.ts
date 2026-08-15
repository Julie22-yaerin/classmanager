import type { NextConfig } from "next";

const securityHeaders = [
  // HSTS: force HTTPS for a year, including subdomains, once a browser has seen it once.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No wildcard CORS anywhere — same-origin only. Nothing here opts into
  // cross-origin access; omitting Access-Control-Allow-Origin is what locks it down.
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

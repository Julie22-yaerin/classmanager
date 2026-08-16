import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/privacy", "/terms"],
        // Everything under these is behind a Firebase Auth wall and personal
        // to each account — nothing there is meant to be crawled or indexed.
        disallow: ["/app", "/onboarding", "/setup", "/daily", "/deadlines", "/references", "/settings", "/classes", "/api"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

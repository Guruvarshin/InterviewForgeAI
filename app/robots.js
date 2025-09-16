// app/robots.js
import { getBaseUrl } from "@/lib/site";

export default function robots() {
  const base = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/share/"],
        disallow: [
          "/dashboard",
          "/session",
          "/user",
          "/api/",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

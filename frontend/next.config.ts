import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // آدرس‌های جنگو با / تمام می‌شوند؛ در توسعه نباید Next آن را حذف کند
  skipTrailingSlashRedirect: isDev,

  // فقط در توسعه: مرورگر همه‌چیز را از یک origin می‌بیند (بدون CORS)
  // در Docker خودِ Nginx مسیر /api/ را به بک‌اند می‌دهد
  async rewrites() {
    if (!isDev) return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost/api/:path*",
      },
    ];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@culturdle/core"],
  serverExternalPackages: ["@electric-sql/pglite", "postgres", "exceljs"],
  // The admin importer reads the question bank workbook at runtime.
  outputFileTracingIncludes: { "/api/admin/import": ["../../content/**"] },
  async redirects() {
    return [
      { source: "/play/:edition/:mode", destination: "/:edition/:mode", permanent: true },
      { source: "/leagues", destination: "/leaderboard", permanent: true },
      { source: "/profile", destination: "/settings", permanent: true },
      { source: "/join/:kind/:code", destination: "/invite/:code", permanent: true },
    ];
  },
};

export default config;

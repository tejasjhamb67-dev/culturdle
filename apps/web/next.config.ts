import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@culturdle/core"],
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default config;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'pdf-parse', 'pdfjs-dist', 'mammoth'],
};

export default nextConfig;

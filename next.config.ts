import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/internal-crm/:path*',
        destination: 'https://211.75.18.228/:path*', // 你的 CRM 位址
      },
    ];
  },
};
export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // 當你訪問 /crm-api/xxx 時，實際上是去抓 211.75.18.228 的內容
        source: '/crm-api/:path*',
        destination: 'http://211.75.18.228/:path*', 
      },
    ];
  },
  // 如果你有其他原本的設定（如 images），請加在下面
};

export default nextConfig;

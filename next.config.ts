import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // As miniaturas de produto vêm do domínio de imagens do Google Shopping/SerpApi
    remotePatterns: [
      { hostname: "encrypted-tbn0.gstatic.com" },
      { hostname: "encrypted-tbn1.gstatic.com" },
      { hostname: "encrypted-tbn2.gstatic.com" },
      { hostname: "encrypted-tbn3.gstatic.com" },
      { hostname: "serpapi.com" },
    ],
  },
};

export default nextConfig;

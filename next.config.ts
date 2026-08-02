import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.16.90.6"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cxfbsgbfjijnxvcmbadl.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;

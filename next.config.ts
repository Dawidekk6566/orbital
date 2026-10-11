import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Screenshot audits post a base64 image to a Server Action; the
      // default 1MB body cap is too small for a full-page capture.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;

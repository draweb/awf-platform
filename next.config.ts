import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@awf/api-contract", "swagger-ui-react"],
  async rewrites() {
    return [
      {
        source: "/api/v1/artifacts/:encodedName/-/:version.tgz",
        destination: "/api/v1/artifacts/:encodedName/tarball/:version",
      },
    ];
  },
};

export default nextConfig;

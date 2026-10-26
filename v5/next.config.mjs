import { fileURLToPath } from 'node:url';
import { configureReadableBuild } from './scripts/readable-build.ts';
import { calculateReleaseId } from './scripts/readable-release.ts';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const releaseId = calculateReleaseId(projectRoot);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/v5',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  swcMinify: false,
  productionBrowserSourceMaps: true,
  generateBuildId: async () => releaseId,
  webpack: (config, context) => configureReadableBuild(config, context, releaseId, projectRoot),
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

import type { NextConfig } from "next"

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true"
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1]
const basePath = isGitHubPagesBuild && repositoryName ? `/${repositoryName}` : ""

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(isGitHubPagesBuild
    ? {
        output: "export" as const,
        basePath,
        assetPrefix: basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
}

export default nextConfig

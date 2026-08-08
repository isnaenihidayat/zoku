import { createMDX } from 'fumadocs-mdx/next'

const repoBase = '/zoku'
const isGitHubPages = process.env.ZOKU_DOCS_GITHUB_PAGES === 'true'

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: false,
  images: { unoptimized: true },
  basePath: repoBase,
  assetPrefix: isGitHubPages ? 'https://isnaenihidayat.github.io/zoku' : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: repoBase,
  },
  turbopack: {
    root: import.meta.dirname,
  },
}

export default createMDX()(config)

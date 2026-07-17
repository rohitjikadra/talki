/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,

  reactStrictMode: false,

  // ✅ Source maps disable (build & disk save)
  productionBrowserSourceMaps: false,

  // ✅ ESLint build ignore
  eslint: {
    ignoreDuringBuilds: true
  },

  // ✅ Low RAM servers ke liye
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb'
    },
    optimizePackageImports: ['@mui/material', '@mui/icons-material', '@mui/x-date-pickers']
  },
  
  webpack(config) {
    // ❗ Disk + memory save
    config.cache = false

    // ❗ Browser bundle clean
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false
    }

    return config
  }
}

export default nextConfig

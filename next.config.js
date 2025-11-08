/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix workspace root to prevent Next.js from looking in parent directories
  outputFileTracingRoot: __dirname,
  
  // Other potential optimizations
  experimental: {
    // Reduce build time
    optimizeCss: false,
  },
}

module.exports = nextConfig
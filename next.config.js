const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // No modularizeImports: @/components/ui has multiple exports per file (e.g. StatCard.tsx exports StatCard + StatGrid);
  // lucide-react direct paths (dist/esm/icons/...) don't match all icon names across versions (e.g. fingerprint vs fingerprint-pattern).
  images: {
    // Device sizes for responsive images - optimized for common mobile breakpoints
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Image sizes for next/image with sizes prop
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable modern image formats for smaller file sizes
    formats: ['image/avif', 'image/webp'],
    // Minimize image processing memory usage
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.storage.railway.app',
      },
      {
        protocol: 'https',
        hostname: 'storage.railway.app',
      },
      // IPFS (Pinata and public gateways)
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: '*.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: 'w3s.link',
      },
      {
        protocol: 'https',
        hostname: 'dweb.link',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.dweb.link',
      },
      // Common image CDNs
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.imgix.net',
      },
    ],
  },
  // Turbopack configuration
  turbopack: {
    // Set root directory to prevent Next.js from detecting parent lockfiles
    root: path.resolve(__dirname),
  },
  // Webpack config for production builds and when --webpack flag is used
  // Following the multisig project approach with WebAssembly support
  webpack: (config, { isServer }) => {
    // Enable WebAssembly support (needed for libsodium)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    
    // Client-side only: Handle libsodium module resolution
    if (!isServer) {
      const webpack = require('webpack')
      
      // Resolve ./libsodium-sumo.mjs imports from libsodium-wrappers-sumo
      // to the libsodium-sumo package (using package.json exports)
      // This must run early in the build process before code-splitting
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^\.\/libsodium-sumo\.mjs$/,
          (resource) => {
            // Only replace if the import is coming from libsodium-wrappers-sumo
            if (resource.context && resource.context.includes('libsodium-wrappers-sumo')) {
              // Use the package name - package.json exports will resolve to the correct file
              // This respects the package.json exports field
              resource.request = 'libsodium-sumo'
            }
          }
        )
      )
      
      config.resolve = {
        ...config.resolve,
        extensionAlias: {
          ".js": [".js", ".ts", ".tsx"],
        },
      };
    }
    
    // Note: Don't override optimization.usedExports as it conflicts with Next.js caching
    // Next.js handles optimization automatically
    
    return config
  },
  
  // External packages for server components to avoid bundling issues
  serverExternalPackages: ['@prisma/client', 'prisma'],
}

module.exports = nextConfig

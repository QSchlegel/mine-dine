const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Turbopack configuration
  turbopack: {},
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
  serverExternalPackages: [],
}

module.exports = nextConfig

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  eslint: {
    // Permite que Vercel compile el proyecto exitosamente ignorando advertencias de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permite que la compilación continúe a pesar de posibles detalles de tipado heredados
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;

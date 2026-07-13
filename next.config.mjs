/** @type {import('next').NextConfig} */
const nextConfig = {
  // F-20: enables src/instrumentation.ts register() to run once at server boot.
  experimental: { instrumentationHook: true },
};

export default nextConfig;

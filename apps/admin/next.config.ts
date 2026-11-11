import type { NextConfig } from 'next';

const config: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: 'standalone',
  transpilePackages: ['@circle/ui-web'],
  poweredByHeader: false,
  // The admin portal must never be indexed or framed (CLAUDE.md §6.11).
  headers() {
    return Promise.resolve([
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]);
  },
};

export default config;

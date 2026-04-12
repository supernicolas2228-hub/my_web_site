/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  },
  // Лёгкий кэш HTML: must-revalidate на каждый запрос тормозит VPN/прокси и переходы из поиска.
  async headers() {
    return [
      {
        source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120, stale-while-revalidate=86400"
          }
        ]
      }
    ];
  }
};

export default nextConfig;

import nextPwa from "next-pwa";

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^\/content\/.*\.json$/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "rp-content", expiration: { maxEntries: 100 } },
    },
    {
      urlPattern: /^\/mapy\/.*\.json$/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "rp-mapy", expiration: { maxEntries: 100 } },
    },
    {
      urlPattern: /^\/visuals\/.*\.svg$/,
      handler: "CacheFirst",
      options: { cacheName: "rp-visuals", expiration: { maxEntries: 200 } },
    },
    {
      urlPattern: /\/skratky\.json$/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "rp-skratky" },
    },
    {
      urlPattern: /\/changelog\.md$/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "rp-changelog" },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);

import nextPwa from "next-pwa";

// Bumpni túto verziu pri zmene obsahu/PWA stratégie — zlikviduje staré cache
// na klientoch, ktorí si držia stale (možno poškodené) JSON responses.
const CACHE_VER = "v3";

const withPWA = nextPwa({
  dest: "public",
  cacheId: `rp-${CACHE_VER}`,
  register: true,
  skipWaiting: true,
  cleanupOutdatedCaches: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      // Tézy — NetworkFirst, aby čerstvý/správny obsah mal prednosť pred cache.
      // Fallback na cache len pri zlyhanej sieti.
      urlPattern: /^\/content\/.*\.json$/,
      handler: "NetworkFirst",
      options: {
        cacheName: `rp-content-${CACHE_VER}`,
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
        cacheableResponse: { statuses: [200] },
      },
    },
    {
      urlPattern: /^\/mapy\/.*\.(json|svg)$/,
      handler: "NetworkFirst",
      options: {
        cacheName: `rp-mapy-${CACHE_VER}`,
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        cacheableResponse: { statuses: [200] },
      },
    },
    {
      urlPattern: /^\/visuals\/.*\.svg$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: `rp-visuals-${CACHE_VER}`,
        expiration: { maxEntries: 200 },
        cacheableResponse: { statuses: [200] },
      },
    },
    {
      urlPattern: /\/skratky\.json$/,
      handler: "NetworkFirst",
      options: {
        cacheName: `rp-skratky-${CACHE_VER}`,
        networkTimeoutSeconds: 5,
        cacheableResponse: { statuses: [200] },
      },
    },
    {
      urlPattern: /\/changelog\.md$/,
      handler: "NetworkFirst",
      options: {
        cacheName: `rp-changelog-${CACHE_VER}`,
        networkTimeoutSeconds: 5,
        cacheableResponse: { statuses: [200] },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);

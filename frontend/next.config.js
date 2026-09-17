/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Самодостаточная сборка для Docker: server.js + только нужные node_modules
  output: "standalone",
};

module.exports = nextConfig;

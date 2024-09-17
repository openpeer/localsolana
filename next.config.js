/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // destination: "http://localhost:8081/api/:path*", // Replace with your API base URL
        destination: "http://64.227.143.219:8081/api/:path*", // Replace with your API base URL
      },
      // {
      //   source: "/editList", // Second source route
      //   destination: "https://app.openpeer.xyz/api/lists/3600", // Corresponding destination
      // },
    ];
  },
};

module.exports = nextConfig;

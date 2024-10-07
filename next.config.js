/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
         destination: "http://localhost:8081/api/:path*", // Replace with your API base URL
        //destination: "http://64.227.143.219:8081/api/:path*", // Replace with your API base URL
      },

    ];
  },
  //distDirectory: 'build'
};

module.exports = nextConfig;

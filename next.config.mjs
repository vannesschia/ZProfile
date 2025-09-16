/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hynrujyblvaexghdlhkw.supabase.co"
      }
    ]
  }
};

export default nextConfig;

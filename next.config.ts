import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents the browser from MIME-sniffing a response away from its declared Content-Type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // LawPilot is never meant to be embedded in a third-party iframe; blocks clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  // Limits how much referrer information is leaked to other origins when navigating away.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disables powerful browser APIs this app never uses.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

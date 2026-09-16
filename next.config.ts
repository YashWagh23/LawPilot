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

// Applied only in production: dev-mode Turbopack HMR relies on eval() and websocket connections
// that a strict CSP would block, and this app has no way to test that combination live before
// deploying. The app itself never loads third-party scripts/styles/fonts (next/font self-hosts
// Google Fonts at build time — see app/layout.tsx), so 'self' covers every real asset origin.
const productionOnlyHeaders =
  process.env.NODE_ENV === "production"
    ? [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ]
    : [];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, ...productionOnlyHeaders],
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

// GitHub Pages serves a project site from /<repo>, so the build needs a
// basePath. CI supplies it; local dev and root-served hosts (Vercel, Netlify)
// leave it empty and run at /.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // The app is entirely client-side, so it ships as static files and can be
  // hosted anywhere.
  output: "export",
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;

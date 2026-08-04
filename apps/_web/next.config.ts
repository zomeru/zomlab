import path from "node:path";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["better-auth"],
  transpilePackages: ["elysiajs-helmet"],
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

export default withMDX(nextConfig);

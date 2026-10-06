import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const root = fileURLToPath(new URL("..", import.meta.url));
const here = fileURLToPath(new URL(".", import.meta.url));

/** Builds the same views into one self-contained HTML file for in-chat preview. */
export default defineConfig({
  root: here,
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "next/image", replacement: `${here}shims/image.tsx` },
      { find: "next/dynamic", replacement: `${here}shims/dynamic.tsx` },
      { find: "@/lib/portraits", replacement: `${here}portraits.ts` },
      { find: "@/lib/podcast-src", replacement: `${here}podcast-src.ts` },
      { find: /^@\//, replacement: root },
    ],
  },
  define: {
    "process.env.NEXT_PUBLIC_HITEX_PREVIEW": JSON.stringify("1"),
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: { outDir: `${here}dist`, emptyOutDir: true, assetsInlineLimit: 100_000_000, cssCodeSplit: false, chunkSizeWarningLimit: 4000 },
});

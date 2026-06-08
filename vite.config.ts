// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
//
// Deployment preset:
//   - On Vercel (the build sets VERCEL=1), use Nitro's "vercel" preset so the build
//     emits the Vercel Build Output API format (.vercel/output) that Vercel serves as
//     a serverless function + static assets. Without it, Vercel treats the build as a
//     static Vite site, finds no SSR route, and returns 404 NOT_FOUND.
//
//     NOTE: the lovable config force-sets Nitro `output` to dist/ (good for the local
//     node-server build) which would otherwise stop the vercel preset from writing to
//     .vercel/output. We override `output` back to the vercel preset's own paths.
//   - Locally / other hosts: a plain Node server (`node dist/server/index.mjs`).
// The lovable config only applies Cloudflare options when the preset is
// "cloudflare-module", so both presets opt out of that cleanly.
const nitro = process.env.VERCEL
  ? {
      preset: "vercel",
      output: {
        dir: ".vercel/output",
        serverDir: ".vercel/output/functions/__server.func",
        publicDir: ".vercel/output/static",
      },
    }
  : { preset: "node-server" };

export default defineConfig({
  nitro,
  tanstackStart: {
    server: { entry: "server" },
  },
  // Pin PostCSS to an inline (empty) config so Vite does NOT search the
  // filesystem for a postcss.config.js. Without this, PostCSS walks UP the
  // directory tree and picks up an unrelated config in a parent folder
  // (e.g. C:\Users\USER\postcss.config.js), which breaks the build with
  // "Cannot find module 'tailwindcss'". Tailwind v4 runs via the
  // @tailwindcss/vite plugin and needs no PostCSS plugins here.
  vite: {
    css: { postcss: {} },
  },
});

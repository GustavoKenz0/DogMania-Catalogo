// The Lovable wrapper already adds TanStack Start, React, Tailwind and Nitro.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type ConfigEnv } from "vite";

function validateHostedApiUrl(mode: string) {
  const value = loadEnv(mode, process.cwd(), "VITE_API_URL").VITE_API_URL;
  const url = value && URL.canParse(value) ? new URL(value) : null;
  if (
    !url ||
    /[\s?#]/.test(value) ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !url.hostname.includes(".") ||
    /(?:^|\.)localhost\.?$|\.local\.?$|^\d+(?:\.\d+){3}$/.test(url.hostname) ||
    !/^\/api\/v1\/?$/.test(url.pathname)
  ) {
    throw new Error(
      "Configure VITE_API_URL com a URL HTTPS pública da API Java, terminada em /api/v1.",
    );
  }
}

export default function configure(env: ConfigEnv) {
  const vercelBuild =
    env.command === "build" &&
    (env.mode === "vercel" || process.env.VERCEL === "1" || process.env.NITRO_PRESET === "vercel");
  const netlifyBuild =
    env.command === "build" &&
    (env.mode === "netlify" ||
      process.env.NETLIFY === "true" ||
      process.env.NITRO_PRESET === "netlify");
  const preset = vercelBuild ? "vercel" : netlifyBuild ? "netlify" : undefined;
  if (preset) validateHostedApiUrl(env.mode);

  return defineConfig({
    ...(preset && { nitro: { preset } }),
    vite: {
      server: { host: "127.0.0.1", port: 8081, strictPort: true },
    },
    tanstackStart: {
      // Keep the custom TanStack Start SSR entry.
      server: { entry: "server" },
    },
  })(env);
}

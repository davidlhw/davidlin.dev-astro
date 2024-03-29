/* eslint-disable turbo/no-undeclared-env-vars */
import { defineConfig } from "astro/config";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import expressiveCode from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginErrorPreview } from "./src/lib/ec/plugins/plugin-error-preview";

/* 
  We are doing some URL mumbo jumbo here to tell Astro what the URL of your website will be.
  In local development, your SEO meta tags will have localhost URL.
  In built production websites, your SEO meta tags should have your website URL.
  So we give our website URL here and the template will know what URL to use 
  for meta tags during build.
  If you don't know your website URL yet, don't worry about this
  and leave it empty or use localhost URL. It won't break anything.
*/
const SERVER_PORT = 3000;
// the url to access your blog during local development
const LOCALHOST_URL = `http://localhost:${SERVER_PORT}`;
// the url to access your blog after deploying it somewhere (Eg. Netlify)
const LIVE_URL = "https://davidlhw.dev";
// this is the astro command your npm script runs
const SCRIPT = process.env.npm_lifecycle_script || "";
const isBuild = SCRIPT.includes("astro build");
let SITE_URL = LOCALHOST_URL;
// When you're building your site in local or in CI, you could just set your URL manually
if (isBuild) {
  SITE_URL = LIVE_URL;
}

// https://astro.build/config
export default defineConfig({
  server: {
    port: SERVER_PORT,
  },
  site: SITE_URL,
  prefetch: true,
  integrations: [
    sitemap(),
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    partytown({
      // Adds dataLayer.push as a forwarding-event.
      config: {
        forward: ["dataLayer.push"],
      },
    }),
    expressiveCode({
      plugins: [
        pluginLineNumbers(),
        pluginCollapsibleSections(),
        pluginErrorPreview(),
      ],
      themes: ["one-dark-pro", "github-light"],
      styleOverrides: {
        codeFontFamily: "JetBrains Mono",
        uiFontFamily: "JetBrains Mono",
      },
      useDarkModeMediaQuery: true,
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      defaultProps: {
        // Disable line numbers by default
        showLineNumbers: true,
        // But enable line numbers for certain languages
        overridesByLang: {
          "ansi,bash,bat,batch,cmd,console,powershell,ps,ps1,psd1,psm1,sh,shell,shellscript,shellsession,zsh":
            {
              showLineNumbers: false,
            },
        },
      },
    }),
    mdx(),
  ],
});

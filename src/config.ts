// Place any global data in this file.

// setup in astro.config.mjs
const BASE_URL = new URL(import.meta.env.SITE);
const SITE_URL = BASE_URL.origin;

export default {
  SITE_TITLE: "David Lin",
  SITE_URL: SITE_URL,
  SITE_DESCRIPTION: "Personal portfolio site and DevLogs",
  AUTHOR_NAME: "David Lin",
  PROFILE_IMAGE_REL_PATH: "/images/profile-lowres.png",
  OG_IMAGE_REL_PATH: "/cover.png",
  OG_IMAGE_WIDTH: 1200,
  OG_IMAGE_HEIGHT: 630,
  TWITTER_HANDLE: "@davidlhw_",
  CTA: {
    MEDIUM: "https://medium.com/@davidlhw",
    GITHUB: "https://github.com/DavidLHW",
    LINKEDIN: "https://www.linkedin.com/in/davidlhw/",
    TWITTER: "https://twitter.com/davidlhw_",
  },
  FOOTER: {
    FRAMEWORK_LINK: "https://astro.build/",
    HOST_LINK: "https://netlify.com/",
  },
  NAV: {
    HOME: {
      NAME: "Home",
      REL_PATH: "/",
    },
    BLOG: {
      NAME: "Blog",
      REL_PATH: "/blog",
    },
    PROJECTS: {
      NAME: "Projects",
      REL_PATH: "/projects",
    },
    NOTES: {
      NAME: "Notes",
      REL_PATH: "/notes",
    },
  },
};

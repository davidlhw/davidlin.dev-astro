import rss from "@astrojs/rss";
import config from "@/config";
import { getCollection } from "astro:content";

export const GET = async () => {
  const posts = await getCollection("blog");

  const sortedPosts = posts
    .filter((p) => !(import.meta.env.MODE === "production" && p.data.draft))
    .sort(
      (a, b) =>
        new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf()
    );

  let baseUrl = config.SITE_URL;
  // removing trailing slash if found
  // https://example.com/ => https://example.com
  baseUrl = baseUrl.replace(/\/+$/g, "");

  const rssItems = sortedPosts.map(({ data, slug }) => {
    if (data.external) {
      const title = data.title;
      const pubDate = data.date;
      const link = data.url;

      return {
        title,
        pubDate,
        link,
      };
    }

    const title = data.title;
    const pubDate = data.date;
    const description = data.description;
    const link = `${baseUrl}${config.NAV.BLOG.REL_PATH}/${slug}`;

    return {
      title,
      pubDate,
      description,
      link,
    };
  });

  return rss({
    title: config.SITE_TITLE,
    description: config.SITE_DESCRIPTION,
    site: baseUrl,
    items: rssItems,
  });
};

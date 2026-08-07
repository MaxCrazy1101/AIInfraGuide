import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { unified } from '@astrojs/markdown-remark';

// 部署目标切换：默认 GitHub Pages（/AIInfraGuide）；
// Cloudflare Pages 上设置环境变量 ASTRO_BASE=/ 与 SITE_URL=https://aiinfraguide.pages.dev
const site = process.env.SITE_URL ?? 'https://caomaolufei.github.io';
const base = process.env.ASTRO_BASE ?? '/AIInfraGuide';

export default defineConfig({
  site,
  base,
  integrations: [tailwind(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: 'light',
      wrap: false,
    },
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        [rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener'] }],
        rehypeKatex,
      ],
    }),
  },
});

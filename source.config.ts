import { defineDocs } from "fumadocs-mdx/config";
import { defineConfig } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: "docs",
});

export default defineConfig({
  lastModifiedTime: 'git',
});

import { createFromSource } from "fumadocs-core/search/server";
import { source } from "~/utils/docs/source";

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  localeMap: {
    en: { language: "english" },
    zh: { language: "chinese" },
    jp: { language: "japanese" },
  }
});

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales:["en","fr","pt","es","de","it"],
  defaultLocale:"en",
  localePrefix:"always"
})
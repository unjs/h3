<script setup lang="ts">
import type { ParsedContent } from "@nuxt/content/dist/runtime/types";

const { seo } = useAppConfig();

const { data: navigation } = await useAsyncData("navigation", () =>
  fetchContentNavigation(),
);
const { data: files } = useLazyFetch<ParsedContent[]>("/api/search.json", {
  default: () => [],
  server: false,
});

useHead({
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang: "en",
  },
});

useSeoMeta({
  ogSiteName: seo?.siteName,
  twitterCard: "summary_large_image",
});

provide("navigation", navigation);
</script>

<template>
  <div>
    <Header />

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <Footer />

    <ClientOnly>
      <LazyUDocsSearch :files="files" :navigation="navigation" />
    </ClientOnly>

    <UNotifications />
  </div>
</template>

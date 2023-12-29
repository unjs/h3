<script setup lang="ts">
import type { NavItem } from "@nuxt/content/dist/runtime/types";

const navigation = inject<NavItem[]>("navigation", []);

const { data: stars } = await useFetch<{ repo: { stars: number } }>('https://ungh.cc/repos/unjs/h3', {
  transform: (data) =>(data.repo.stars)
})
const { data: tag } = await useFetch<{ release: { tag: string } }>('https://ungh.cc/repos/unjs/h3/releases/latest', {
  transform: (data) =>(data.release.tag)
})

const activeClassButton = 'bg-primary bg-opacity-40 dark:bg-opacity-30'
</script>

<template>
<UHeader :ui="{ logo: 'items-center' }" :links="mapContentNavigation(navigation)">
    <template #logo>
      <img src="../assets/logo.png" alt="" class="h-7 w-7" />
      <span>
        H3
      </span>
      <UBadge v-if="tag" :label="tag" color="primary" variant="subtle" size="xs" />
    </template>

    <template #center>
      <UDocsSearchButton class="hidden lg:flex" />
    </template>

    <template #right>
      <UTooltip v-if="stars" class="hidden lg:flex" text="H3 GitHub Stars">
        <UButton
          icon="i-simple-icons-github" to="https://github.com/unjs/h3" target="_blank" aria-label="Visit UnJS/H3" v-bind="{ ...$ui.button?.secondary }" square
        >
          {{ formatNumber(stars) }}
        </UButton>
      </UTooltip>
    </template>

    <template #panel>
      <UNavigationTree :links="mapContentNavigation(navigation)" />
    </template>
  </UHeader>
</template>

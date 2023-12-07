<script lang="ts" setup>
defineOptions({
  inheritAttrs: false,
});

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div
    class="w-full h-full flex flex-col justify-center text-center bg-slate-900 p-8"
  >
    <div class="relative">
      <h1 class="text-8xl mb-4 text-white">
        {{ title }}
      </h1>
      <p class="text-5xl text-gray-200 leading-tight">
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ICON_PATHS, type IconName } from './iconPaths';

withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 16 });
</script>

<template>
  <svg :width="size" :height="size" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path :d="ICON_PATHS[name]" />
  </svg>
</template>

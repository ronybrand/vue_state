<script setup lang="ts">
import { useBackendInfo, useFrontendVersion } from '../composables/useBuildInfo';
import { formatDate } from '../lib/formatDate';

const { data: frontendVersion } = useFrontendVersion();
const { data: backendInfo } = useBackendInfo();
</script>

<template>
  <footer v-if="frontendVersion || backendInfo" class="mt-4 py-3 text-center text-xs text-gray-600">
    <span v-if="frontendVersion">
      front {{ frontendVersion.commit }} · {{ formatDate(frontendVersion.buildDate) }}
    </span>
    <span v-if="frontendVersion && backendInfo" class="mx-2">|</span>
    <span v-if="backendInfo">
      back {{ backendInfo.build.commit }} · {{ formatDate(backendInfo.build.time) }}
    </span>
  </footer>
</template>

<script setup lang="ts">
const route = useRoute()
const targetPath = `/results/${String(route.params.attemptId ?? '')}`

if (import.meta.client) {
  window.location.replace(targetPath)
} else {
  await navigateTo(targetPath, { replace: true })
}
</script>

<template>
  <div />
</template>

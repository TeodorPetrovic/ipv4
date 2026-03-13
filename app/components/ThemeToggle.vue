<script setup lang="ts">
const colorMode = useColorMode()
const { t } = useAppI18n()

const isDark = computed(() => colorMode.value === 'dark')

function toggleColorMode() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <ClientOnly>
    <UButton
      color="neutral"
      variant="outline"
      :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
      :aria-label="t('layout.toggleTheme')"
      @click="toggleColorMode"
    />
  </ClientOnly>
</template>

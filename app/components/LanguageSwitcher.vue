<script setup lang="ts">
const { locale, changeLocale } = useAppI18n()

const languages = [
  { code: 'sr-Cyrl' as const, label: 'Ћир' },
  { code: 'sr-Latn' as const, label: 'Lat' },
  { code: 'en' as const, label: 'EN' },
]
</script>

<template>
  <ClientOnly>
    <div class="flex items-center gap-1">
      <UButton
        v-for="lang in languages"
        :key="lang.code"
        size="xs"
        :color="locale === lang.code ? 'primary' : 'neutral'"
        :variant="locale === lang.code ? 'solid' : 'outline'"
        @click="changeLocale(lang.code)"
      >
        {{ lang.label }}
      </UButton>
    </div>
  </ClientOnly>
</template>

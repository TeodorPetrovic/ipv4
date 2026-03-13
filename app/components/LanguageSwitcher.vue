<script setup lang="ts">
import type { AppLocale } from '~/composables/useAppI18n'

const { t, locale, changeLocale } = useAppI18n()

const languages = [
  { code: 'sr-Cyrl' as const, label: 'Српски' },
  { code: 'sr-Latn' as const, label: 'Srpski' },
  { code: 'en' as const, label: 'English' },
]

const selectedLocale = computed({
  get: () => locale.value,
  set: (value: AppLocale | undefined) => {
    if (value) {
      void changeLocale(value)
    }
  },
})
</script>

<template>
  <ClientOnly>
    <USelect
      v-model="selectedLocale"
      class="w-24"
      color="neutral"
      variant="outline"
      :items="languages"
      value-key="code"
      label-key="label"
      :placeholder="t('layout.languageSwitcher')"
      :aria-label="t('layout.languageSwitcher')"
    />
  </ClientOnly>
</template>

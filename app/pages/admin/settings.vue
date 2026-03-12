<script setup lang="ts">
import type { AuthState } from '#shared/types/api'

definePageMeta({
  layout: 'admin',
  title: 'Settings',
})

const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch<AuthState>('/api/auth/session', {
  headers: requestHeaders,
})

if (!authState.value?.isAdmin) {
  await navigateTo('/admin')
}

const loading = ref(false)
const pageError = ref('')
const savedMessage = ref('')

const scoringConfig = reactive({
  level1: 10,
  level2: 15,
  level3: 20,
  level4: 10,
  level5: 10,
  level6: 15,
  level7: 20,
})

const totalPercentage = computed(() => {
  return scoringConfig.level1
    + scoringConfig.level2
    + scoringConfig.level3
    + scoringConfig.level4
    + scoringConfig.level5
    + scoringConfig.level6
    + scoringConfig.level7
})

async function loadSettings() {
  loading.value = true
  savedMessage.value = ''

  try {
    const response = await $fetch<{
      level1: number
      level2: number
      level3: number
      level4: number
      level5: number
      level6: number
      level7: number
    }>('/api/admin/settings/scoring', {
      headers: requestHeaders,
    })

    scoringConfig.level1 = response.level1
    scoringConfig.level2 = response.level2
    scoringConfig.level3 = response.level3
    scoringConfig.level4 = response.level4
    scoringConfig.level5 = response.level5
    scoringConfig.level6 = response.level6
    scoringConfig.level7 = response.level7
    pageError.value = ''
  } catch (fetchError: any) {
    pageError.value = fetchError.data?.message || 'Unable to load scoring settings'
  } finally {
    loading.value = false
  }
}

if (authState.value?.isAdmin) {
  await loadSettings()
}

async function saveSettings() {
  loading.value = true
  savedMessage.value = ''

  try {
    const response = await $fetch<{
      level1: number
      level2: number
      level3: number
      level4: number
      level5: number
      level6: number
      level7: number
    }>('/api/admin/settings/scoring', {
      method: 'POST',
      body: scoringConfig,
    })

    scoringConfig.level1 = response.level1
    scoringConfig.level2 = response.level2
    scoringConfig.level3 = response.level3
    scoringConfig.level4 = response.level4
    scoringConfig.level5 = response.level5
    scoringConfig.level6 = response.level6
    scoringConfig.level7 = response.level7

    pageError.value = ''
    savedMessage.value = 'Settings saved.'
  } catch (fetchError: any) {
    pageError.value = fetchError.data?.message || 'Unable to save scoring settings'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-3">
    <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/admin/tests">
      Back to tests
    </UButton>

    <UCard>
      <template #header>
        <div class="space-y-1">
          <h1 class="text-lg font-semibold">Scoring defaults</h1>
          <p class="text-sm text-muted">These values are applied globally during grading for all tests.</p>
          <p class="text-xs text-muted">Current total: {{ totalPercentage }}%</p>
        </div>
      </template>

      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UFormField label="Level 1 %" required>
            <UInputNumber v-model="scoringConfig.level1" :min="0" :max="100" class="w-full" />
          </UFormField>
          <UFormField label="Level 2 %" required>
            <UInputNumber v-model="scoringConfig.level2" :min="0" :max="100" class="w-full" />
          </UFormField>
          <UFormField label="Level 3 %" required>
            <UInputNumber v-model="scoringConfig.level3" :min="0" :max="100" class="w-full" />
          </UFormField>
          <UFormField label="Level 4 %" required>
            <UInputNumber v-model="scoringConfig.level4" :min="0" :max="100" class="w-full" />
          </UFormField>
          <UFormField label="Level 5 %" required>
            <UInputNumber v-model="scoringConfig.level5" :min="0" :max="100" class="w-full" />
          </UFormField>
          <UFormField label="Level 6 %" required>
            <UInputNumber v-model="scoringConfig.level6" :min="0" :max="100" class="w-full" />
          </UFormField>
          <UFormField label="Level 7 %" required>
            <UInputNumber v-model="scoringConfig.level7" :min="0" :max="100" class="w-full" />
          </UFormField>
        </div>

        <UAlert
          v-if="totalPercentage !== 100"
          color="warning"
          variant="soft"
          title="Percentages must sum to 100%"
        />

        <UAlert
          v-if="pageError"
          color="error"
          variant="soft"
          :title="pageError"
        />

        <UAlert
          v-if="savedMessage"
          color="success"
          variant="soft"
          :title="savedMessage"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" :loading="loading" @click="loadSettings">
            Reload
          </UButton>
          <UButton :loading="loading" :disabled="totalPercentage !== 100" @click="saveSettings">
            Save settings
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const statusCode = computed(() => props.error?.statusCode ?? 500)
const statusMessage = computed(() => props.error?.statusMessage || 'Unexpected error')
const isNotFound = computed(() => statusCode.value === 404)

async function goHome() {
  await clearError({ redirect: '/' })
}

async function goTests() {
  await clearError({ redirect: '/tests' })
}
</script>

<template>
  <main class="min-h-screen bg-linear-to-b from-slate-50 to-white px-6 py-10">
    <div class="mx-auto max-w-xl">
      <UCard class="border border-gray-200">
        <template #header>
          <div class="space-y-1">
            <p class="text-sm font-semibold uppercase tracking-wide text-muted">
              Error {{ statusCode }}
            </p>
            <h1 class="text-2xl font-semibold text-highlighted">
              {{ isNotFound ? 'This endpoint does not exist' : 'Request cannot be completed' }}
            </h1>
          </div>
        </template>

        <p class="text-sm text-muted">
          {{ isNotFound ? 'The page or endpoint you requested was not found.' : statusMessage }}
        </p>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-2">
            <UButton color="neutral" variant="outline" icon="i-lucide-list-checks" @click="goTests">
              Back to tests
            </UButton>
            <UButton color="neutral" variant="solid" icon="i-lucide-home" @click="goHome">
              Go to home
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </main>
</template>

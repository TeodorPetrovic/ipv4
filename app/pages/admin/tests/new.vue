<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  title: 'Create Test',
})

const form = reactive({
  title: '',
  description: '',
  startAt: '',
  endAt: '',
  durationMinutes: 60,
  maxAttempts: 1,
  isPublished: true,
})

const loading = ref(false)
const error = ref('')
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch('/api/auth/session', {
  headers: requestHeaders,
})

if (!authState.value?.isAdmin) {
  await navigateTo('/admin')
}

async function save() {
  error.value = ''
  loading.value = true

  try {
    await $fetch('/api/tests', {
      method: 'POST',
      body: form,
    })

    await navigateTo('/admin/tests')
  } catch (fetchError: any) {
    error.value = fetchError.data?.message || 'Unable to create test'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h1 class="text-lg font-semibold">Basic Information</h1>
            <p class="text-sm text-muted">Set the test name and optional description shown in the admin area.</p>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="Title" required>
            <UInput v-model="form.title" class="w-full" placeholder="IPv4 Midterm A" />
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="form.description" class="w-full" :rows="6" placeholder="Optional description" />
          </UFormField>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="space-y-1">
            <h1 class="text-lg font-semibold">Availability</h1>
            <p class="text-sm text-muted">Define when the test is open and how many attempts each student gets.</p>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="Start date" required>
            <UInput v-model="form.startAt" class="w-full" type="datetime-local" />
          </UFormField>

          <UFormField label="End date" required>
            <UInput v-model="form.endAt" class="w-full" type="datetime-local" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Duration (minutes)" required>
              <UInput v-model="form.durationMinutes" class="w-full" type="number" min="1" />
            </UFormField>

            <UFormField label="Max attempts" required>
              <UInput v-model="form.maxAttempts" class="w-full" type="number" min="1" />
            </UFormField>
          </div>

          <div class="rounded-lg border border-default p-4">
            <UFormField label="Published">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-medium">Visible to students</p>
                  <p class="text-xs text-muted">Students can only start published tests.</p>
                </div>

                <USwitch v-model="form.isPublished" />
              </div>
            </UFormField>
          </div>
        </div>
      </UCard>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
    />

    <div class="flex justify-end gap-2">
      <UButton color="neutral" variant="outline" to="/admin/tests">
        Cancel
      </UButton>
      <UButton :loading="loading" @click="save">
        Save Test
      </UButton>
    </div>
  </div>
</template>

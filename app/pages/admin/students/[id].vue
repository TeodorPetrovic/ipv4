<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  title: 'Update Student',
})

const route = useRoute()
const studentId = Number(route.params.id)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const { data: authState } = await useFetch('/api/auth/session', {
  headers: requestHeaders,
})

const loading = ref(false)
const error = ref('')

if (!authState.value?.isAdmin) {
  await navigateTo('/admin')
}

const form = reactive({
  studentId: '',
  name: '',
})

const { data, error: fetchError } = await useFetch<{
  studentId: string
  name: string
}>(`/api/students/${studentId}`, {
  headers: requestHeaders,
  immediate: Boolean(authState.value?.isAdmin),
})

if (fetchError.value) {
  error.value = (fetchError.value as any).data?.message || 'Unable to load student'
}

if (data.value) {
  form.studentId = data.value.studentId
  form.name = data.value.name
}

async function save() {
  error.value = ''
  loading.value = true

  try {
    await $fetch(`/api/students/${studentId}`, {
      method: 'POST',
      body: form,
    })

    await navigateTo('/admin/students')
  } catch (requestError: any) {
    error.value = requestError.data?.message || 'Unable to update student'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="space-y-1">
        <h1 class="text-lg font-semibold">Update Student</h1>
        <p class="text-sm text-muted">Change the student ID or display name.</p>
      </div>
    </template>

    <div class="space-y-4">
      <UFormField label="Student ID" required>
        <UInput v-model="form.studentId" placeholder="20240001" />
      </UFormField>

      <UFormField label="Name">
        <UInput v-model="form.name" placeholder="Optional name" />
      </UFormField>

      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        :title="error"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" to="/admin/students">
          Cancel
        </UButton>
        <UButton :loading="loading" @click="save">
          Save
        </UButton>
      </div>
    </template>
  </UCard>
</template>

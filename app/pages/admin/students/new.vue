<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  title: 'Create Student',
})

const form = reactive({
  studentId: '',
  name: '',
})

const loading = ref(false)
const error = ref('')
const { authState, ensureAuthSession } = useAuthSession()
await ensureAuthSession()

if (!authState.value?.isAdmin) {
  await navigateTo('/admin')
}

async function save() {
  error.value = ''
  loading.value = true

  try {
    await $fetch('/api/students', {
      method: 'POST',
      body: form,
    })

    await navigateTo('/admin/students')
  } catch (fetchError: any) {
    error.value = fetchError.data?.message || 'Unable to create student'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="space-y-1">
        <h1 class="text-lg font-semibold">Create Student</h1>
        <p class="text-sm text-muted">Add a student manually if needed.</p>
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

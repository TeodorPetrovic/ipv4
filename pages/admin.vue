<script setup lang="ts">
const pin = ref('')
const pinVerified = ref(false)
const pinError = ref('')
const startDate = ref('')
const endDate = ref('')
const duration = ref(60)
const saving = ref(false)
const saveMsg = ref('')
const saveError = ref('')

async function verifyPin() {
  pinError.value = ''
  try {
    // Verify PIN by attempting a no-op config save with current values
    await $fetch('/api/test/config', {
      method: 'POST',
      body: { pin: pin.value, startDate: null, endDate: null, durationMinutes: 60, verifyOnly: true }
    })
    pinVerified.value = true
    const config = await $fetch('/api/test/config') as any
    if (config.start_date) startDate.value = config.start_date.replace(' ', 'T').slice(0, 16)
    if (config.end_date) endDate.value = config.end_date.replace(' ', 'T').slice(0, 16)
    duration.value = config.duration_minutes || 60
  } catch {
    pinError.value = 'Invalid PIN'
  }
}

async function saveConfig() {
  saving.value = true
  saveMsg.value = ''
  saveError.value = ''
  try {
    await $fetch('/api/test/config', {
      method: 'POST',
      body: { pin: pin.value, startDate: startDate.value || null, endDate: endDate.value || null, durationMinutes: duration.value }
    })
    saveMsg.value = 'Configuration saved successfully'
  } catch (e: any) {
    saveError.value = e.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <UCard class="w-full max-w-lg">
      <template #header>
        <h1 class="text-xl font-bold text-gray-900">Admin Settings</h1>
      </template>

      <div v-if="!pinVerified" class="space-y-4">
        <UFormGroup label="Admin PIN">
          <UInput v-model="pin" type="password" placeholder="Enter PIN" @keyup.enter="verifyPin" />
        </UFormGroup>
        <UAlert v-if="pinError" color="red" :title="pinError" />
        <UButton @click="verifyPin">Verify PIN</UButton>
      </div>

      <div v-else class="space-y-4">
        <UFormGroup label="Test Start Date/Time">
          <UInput v-model="startDate" type="datetime-local" />
        </UFormGroup>
        <UFormGroup label="Test End Date/Time">
          <UInput v-model="endDate" type="datetime-local" />
        </UFormGroup>
        <UFormGroup label="Duration (minutes)">
          <UInput v-model="duration" type="number" min="1" />
        </UFormGroup>
        <UAlert v-if="saveMsg" color="green" :title="saveMsg" />
        <UAlert v-if="saveError" color="red" :title="saveError" />
        <UButton :loading="saving" @click="saveConfig">Save Configuration</UButton>
      </div>
    </UCard>
  </div>
</template>

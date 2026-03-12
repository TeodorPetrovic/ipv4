<script setup lang="ts">
import { CalendarDate, Time } from '@internationalized/date'
import type { AuthState } from '#shared/types/api'

definePageMeta({
  layout: 'admin',
  title: 'Edit Test',
})

const route = useRoute()
const testId = Number(route.params.id)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

const { data: authState } = await useFetch<AuthState>('/api/auth/session', {
  headers: requestHeaders,
})

if (!authState.value?.isAdmin) {
  await navigateTo('/admin')
}

const loading = ref(false)
const error = ref('')

const now = new Date()

const title = ref('')
const startDate = shallowRef(new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate()))
const startTime = shallowRef(new Time(now.getHours(), now.getMinutes()))
const endDate = shallowRef(new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate()))
const endTime = shallowRef(new Time(now.getHours() + 1, now.getMinutes()))
const durationMinutes = ref(60)
const testPoints = ref(100)
const maxAttempts = ref(1)
const unlimitedDuration = ref(false)
const unlimitedAttempts = ref(false)

const inputStartDate = useTemplateRef('inputStartDate')
const inputEndDate = useTemplateRef('inputEndDate')

function parseApiDatetime(isoString: string | null): { date: CalendarDate; time: Time } {
  if (!isoString) {
    const n = new Date()
    return {
      date: new CalendarDate(n.getFullYear(), n.getMonth() + 1, n.getDate()),
      time: new Time(n.getHours(), n.getMinutes()),
    }
  }
  const d = new Date(isoString)
  const offset = d.getTimezoneOffset() * 60000
  const local = new Date(d.getTime() - offset)
  return {
    date: new CalendarDate(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate()),
    time: new Time(local.getUTCHours(), local.getUTCMinutes()),
  }
}

function toApiDatetime(date: CalendarDate, time: Time): string {
  const y = date.year
  const m = String(date.month).padStart(2, '0')
  const d = String(date.day).padStart(2, '0')
  const h = String(time.hour).padStart(2, '0')
  const min = String(time.minute).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

const { data, error: fetchError } = await useFetch<{
  title: string
  description: string | null
  startAt: string | null
  endAt: string | null
  durationMinutes: number
  maxAttempts: number
  isPublished: boolean
  testPoints?: number
  unlimitedDuration?: boolean
  unlimitedAttempts?: boolean
}>(`/api/tests/${testId}`, {
  headers: requestHeaders,
  immediate: Boolean(authState.value?.isAdmin),
})

watchEffect(() => {
  if (!data.value) {
    return
  }

  title.value = data.value.title

  const start = parseApiDatetime(data.value.startAt)
  startDate.value = start.date
  startTime.value = start.time

  const end = parseApiDatetime(data.value.endAt)
  endDate.value = end.date
  endTime.value = end.time

  durationMinutes.value = data.value.durationMinutes
  testPoints.value = data.value.testPoints ?? 100
  unlimitedDuration.value = Boolean(data.value.unlimitedDuration)
  unlimitedAttempts.value = Boolean(data.value.unlimitedAttempts)
  maxAttempts.value = data.value.maxAttempts > 1000000 ? 1 : data.value.maxAttempts
})

if (fetchError.value) {
  error.value = (fetchError.value as any).data?.message || 'Unable to load test'
}

async function save() {
  error.value = ''
  loading.value = true

  try {
    await $fetch(`/api/tests/${testId}`, {
      method: 'POST',
      body: {
        title: title.value,
        startAt: toApiDatetime(startDate.value, startTime.value),
        endAt: toApiDatetime(endDate.value, endTime.value),
        durationMinutes: durationMinutes.value,
        testPoints: testPoints.value,
        maxAttempts: maxAttempts.value,
        unlimitedDuration: unlimitedDuration.value,
        unlimitedAttempts: unlimitedAttempts.value,
      },
    })

    await navigateTo(`/admin/tests/${testId}`)
  } catch (requestError: any) {
    error.value = requestError.data?.message || 'Unable to update test'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-3">
    <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" :to="`/admin/tests/${testId}`">
      Back to test
    </UButton>

    <UCard>
      <template #header>
        <div class="space-y-1">
          <h1 class="text-lg font-semibold">Edit test</h1>
          <p class="text-sm text-muted">Update title, schedule, attempts, and scoring points.</p>
        </div>
      </template>

      <div class="space-y-4">
        <UFormField label="Test name" required>
          <UInput v-model="title" class="w-full" />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Starts At" required>
            <div class="space-y-2">
              <UInputDate ref="inputStartDate" v-model="startDate" class="w-full">
                <template #trailing>
                  <UPopover :reference="inputStartDate?.inputsRef[3]?.$el">
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      icon="i-lucide-calendar"
                      aria-label="Select a date"
                      class="px-0"
                    />
                    <template #content>
                      <UCalendar v-model="startDate" class="p-2" />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
              <UInputTime v-model="startTime" :hour-cycle="24" class="w-full" />
            </div>
          </UFormField>

          <UFormField label="Ends At" required>
            <div class="space-y-2">
              <UInputDate ref="inputEndDate" v-model="endDate" class="w-full">
                <template #trailing>
                  <UPopover :reference="inputEndDate?.inputsRef[3]?.$el">
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      icon="i-lucide-calendar"
                      aria-label="Select a date"
                      class="px-0"
                    />
                    <template #content>
                      <UCalendar v-model="endDate" class="p-2" />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
              <UInputTime v-model="endTime" :hour-cycle="24" class="w-full" />
            </div>
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-1">
          <UFormField label="Test points" required>
            <UInputNumber v-model="testPoints" :min="1" class="w-full" />
          </UFormField>

          <UFormField label="Duration (minutes)" required>
            <UInputNumber v-model="durationMinutes" :min="1" :disabled="unlimitedDuration" class="w-full" />
          </UFormField>

          <UFormField label="Max attempts" required>
            <UInputNumber v-model="maxAttempts" :min="1" :disabled="unlimitedAttempts" class="w-full" />
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex items-center justify-between gap-4 rounded-lg border border-default p-3">
            <span class="text-sm font-medium">Unlimited duration</span>
            <USwitch v-model="unlimitedDuration" />
          </div>

          <div class="flex items-center justify-between gap-4 rounded-lg border border-default p-3">
            <span class="text-sm font-medium">Unlimited attempts</span>
            <USwitch v-model="unlimitedAttempts" />
          </div>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="error"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" :to="`/admin/tests/${testId}`">
            Cancel
          </UButton>
          <UButton :loading="loading" @click="save">
            Save changes
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'

type UseAttemptTimerOptions = {
  deadlineAt: Ref<string | null | undefined>
  canSubmit: Ref<boolean>
  onExpired: () => void | Promise<void>
}

export function useAttemptTimer(options: UseAttemptTimerOptions) {
  const nowTick = ref(Date.now())
  const lastSyncLocalMs = ref(Date.now())
  const lastSyncServerMs = ref<number | null>(null)
  const expiryHandled = ref(false)
  let countdownTimer: ReturnType<typeof setInterval> | null = null
  let serverSyncTimer: ReturnType<typeof setInterval> | null = null

  const estimatedServerNowMs = computed(() => {
    if (lastSyncServerMs.value === null) {
      return nowTick.value
    }

    return lastSyncServerMs.value + (nowTick.value - lastSyncLocalMs.value)
  })

  const remainingTimeMs = computed(() => {
    if (!options.canSubmit.value || !options.deadlineAt.value) {
      return 0
    }

    const deadlineMs = new Date(options.deadlineAt.value).getTime()
    return Math.max(0, deadlineMs - estimatedServerNowMs.value)
  })

  const remainingTimeLabel = computed(() => {
    const totalSeconds = Math.floor(remainingTimeMs.value / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const hh = String(hours).padStart(2, '0')
    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')

    return `${hh}:${mm}:${ss}`
  })

  const remainingTimeColor = computed(() => {
    if (remainingTimeMs.value <= 60_000) {
      return 'text-red-600'
    }

    if (remainingTimeMs.value <= 5 * 60_000) {
      return 'text-amber-600'
    }

    return 'text-emerald-600'
  })

  async function syncWithServer() {
    try {
      const timeResponse = await $fetch<{ now: string }>('/api/time')
      const serverNowMs = new Date(timeResponse.now).getTime()

      if (!Number.isNaN(serverNowMs)) {
        lastSyncServerMs.value = serverNowMs
        lastSyncLocalMs.value = Date.now()
      }
    } catch {
      // Keep the last known server time when sync fails.
    }
  }

  async function handleExpiry() {
    if (expiryHandled.value || !options.canSubmit.value || remainingTimeMs.value !== 0) {
      return
    }

    expiryHandled.value = true
    await options.onExpired()
  }

  function stop() {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }

    if (serverSyncTimer) {
      clearInterval(serverSyncTimer)
      serverSyncTimer = null
    }
  }

  watch(
    [() => options.deadlineAt.value, () => options.canSubmit.value],
    ([, canSubmit]) => {
      expiryHandled.value = !canSubmit
    },
    { immediate: true },
  )

  onMounted(() => {
    countdownTimer = setInterval(() => {
      nowTick.value = Date.now()
      void handleExpiry()
    }, 1000)

    void syncWithServer()
    void handleExpiry()

    serverSyncTimer = setInterval(() => {
      void syncWithServer()
    }, 15000)
  })

  onBeforeUnmount(stop)

  return {
    remainingTimeMs,
    remainingTimeLabel,
    remainingTimeColor,
    stop,
    syncWithServer,
  }
}

import type { AuthState } from '#shared/types/api'

function createDefaultAuthState(): AuthState {
  return {
    student: null,
    isAdmin: false,
  }
}

export function useAuthSession() {
  const authState = useState<AuthState>('auth-state', createDefaultAuthState)
  const authLoaded = useState<boolean>('auth-loaded', () => false)

  async function loadAuthSession(force = false) {
    if (authLoaded.value && !force) {
      return authState.value
    }

    const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

    try {
      const session = await $fetch<AuthState>('/api/auth/session', {
        headers: requestHeaders,
      })

      authState.value = {
        student: session.student ?? null,
        isAdmin: Boolean(session.isAdmin),
      }
    } catch {
      authState.value = createDefaultAuthState()
    } finally {
      authLoaded.value = true
    }

    return authState.value
  }

  async function ensureAuthSession() {
    return loadAuthSession(false)
  }

  async function refreshAuthSession() {
    return loadAuthSession(true)
  }

  return {
    authState,
    authLoaded,
    ensureAuthSession,
    refreshAuthSession,
  }
}

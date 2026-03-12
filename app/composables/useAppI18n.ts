import type { i18n } from 'i18next'
import { readonly, ref } from 'vue'
import srCyrl from '~/locales/sr-Cyrl'

type Locale = 'sr-Cyrl' | 'sr-Latn' | 'en'

// Module-level shared state (safe: server renders once per request, client has one instance)
let _instance: i18n | null = null
const _locale = ref<Locale>('sr-Cyrl')

export function _setI18nInstance(instance: i18n, locale: Locale) {
  _instance = instance
  _locale.value = locale
}

function getNestedValue(obj: Record<string, unknown>, keys: string[]): string | undefined {
  let current: unknown = obj
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : undefined
}

export function useAppI18n() {
  function t(key: string, vars?: Record<string, unknown>): string {
    if (_instance) {
      return _instance.t(key, vars as Parameters<i18n['t']>[1]) as string
    }
    // SSR fallback: use sr-Cyrl translations directly to avoid hydration mismatches
    const keys = key.split('.')
    const value = getNestedValue(srCyrl as unknown as Record<string, unknown>, keys)
    if (value !== undefined) {
      if (!vars) return value
      return Object.entries(vars).reduce(
        (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
        value,
      )
    }
    return key
  }

  async function changeLocale(locale: Locale) {
    if (_instance) {
      await _instance.changeLanguage(locale)
      _locale.value = locale
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('app-locale', locale)
      }
    }
  }

  return {
    t,
    locale: readonly(_locale),
    changeLocale,
  }
}

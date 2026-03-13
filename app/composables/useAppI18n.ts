import type { i18n } from 'i18next'
import { readonly, ref } from 'vue'
import srCyrl from '~/locales/sr-Cyrl'

export type AppLocale = 'sr-Cyrl' | 'sr-Latn' | 'en'
const VALID_LOCALES: AppLocale[] = ['sr-Cyrl', 'sr-Latn', 'en']

// Module-level shared state (safe: server renders once per request, client has one instance)
let _instance: i18n | null = null
const _locale = ref<AppLocale>('sr-Cyrl')

function isAppLocale(locale: string): locale is AppLocale {
  return VALID_LOCALES.includes(locale as AppLocale)
}

export function _setI18nInstance(instance: i18n, locale: AppLocale) {
  _instance = instance
  _locale.value = locale

  instance.on('languageChanged', (nextLocale) => {
    if (isAppLocale(nextLocale)) {
      _locale.value = nextLocale
    }
  })
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
    // Read locale here so Vue tracks it during render and updates immediately on language changes.
    const activeLocale = _locale.value

    if (_instance) {
      return _instance.t(key as any, { lng: activeLocale, ...(vars ?? {}) } as any) as string
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

  async function changeLocale(locale: AppLocale) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app-locale', locale)
    }

    if (_instance) {
      await _instance.changeLanguage(locale)
    }

    _locale.value = locale
  }

  return {
    t,
    locale: readonly(_locale),
    changeLocale,
  }
}

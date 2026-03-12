import i18next from 'i18next'
import en from '~/locales/en'
import srCyrl from '~/locales/sr-Cyrl'
import srLatn from '~/locales/sr-Latn'
import { _setI18nInstance } from '~/composables/useAppI18n'

type Locale = 'sr-Cyrl' | 'sr-Latn' | 'en'
const VALID_LOCALES: Locale[] = ['sr-Cyrl', 'sr-Latn', 'en']

export default defineNuxtPlugin(async () => {
  const stored = localStorage.getItem('app-locale') as Locale | null
  const lng: Locale = stored && VALID_LOCALES.includes(stored) ? stored : 'sr-Cyrl'

  await i18next.init({
    lng,
    fallbackLng: 'sr-Cyrl',
    resources: {
      en: { translation: en as unknown as Record<string, string> },
      'sr-Latn': { translation: srLatn as unknown as Record<string, string> },
      'sr-Cyrl': { translation: srCyrl as unknown as Record<string, string> },
    },
    interpolation: {
      escapeValue: false,
    },
  })

  _setI18nInstance(i18next, lng)
})

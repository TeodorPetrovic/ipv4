// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],

  app: {
    head: {
      title: 'IP Singidunum',
      htmlAttrs: {
        lang: 'en'
      },
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
    }
  },

  nitro: {
    preset: 'bun',
  },

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@internationalized/date',
        'i18next',
      ]
    }
  },
  css: ['~/assets/css/main.css'],
})
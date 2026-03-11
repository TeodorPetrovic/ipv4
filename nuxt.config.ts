export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  colorMode: { preference: 'light' },
  ssr: true,
  nitro: {
    experimental: { wasm: false }
  }
})

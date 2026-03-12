export default defineAppConfig({
  ui: {
    colors: {
      primary: 'red',
      secondary: 'orange',
      success: 'emerald',
      info: 'sky',
      warning: 'amber',
      error: 'rose',
      neutral: 'zinc',
    },
  },
})

// Dark mode and shade overrides — add the CSS variables from the CSS export to your main.css
// Dark mode uses different palettes:
// primary: red-600 (shifted from default 500)
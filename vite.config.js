import { defineConfig } from 'vite'

export default defineConfig({
  // Tank Mode requires NO plugins.
  // This tells the server to just serve the HTML file.
  server: {
    host: true
  }
})

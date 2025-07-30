import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

const isEmbed = process.env.EMBED === 'true'
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input:  resolve(__dirname, isEmbed ? 'embed.html' : 'index.html')
        },
    },
})
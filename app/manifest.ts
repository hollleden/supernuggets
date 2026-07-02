import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'supernuggets',
    short_name: 'supernuggets',
    description: 'A clean, fast pocket vault for everything worth keeping.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFF00',
    theme_color: '#FAFF00',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}

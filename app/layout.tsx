import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'supernuggets // vault dashboard',
  description: 'A clean, fast pocket vault for everything worth keeping.',
  icons: {
    icon: [
      { url: '/favicon-pixel.png', type: 'image/png' },
    ],
    apple: '/favicon-pixel.png',
  },
}

// Inline pre-paint script: avoids flash-of-wrong-theme. Reads localStorage
// then falls back to OS preference. Also listens for live OS theme changes.
const noFlashTheme = `
(function(){try{
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var t = localStorage.getItem('theme');
  function apply(dark) {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }
  apply(t === 'dark' || (!t && mq.matches));
  mq.addEventListener('change', function(e) {
    if (!localStorage.getItem('theme')) apply(e.matches);
  });
}catch(e){}})();
`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={jetbrainsMono.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body className="font-mono antialiased bg-background text-foreground">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

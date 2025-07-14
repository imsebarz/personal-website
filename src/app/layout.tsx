import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import '../styles/globals.scss'

const inter = Inter({ subsets: ['latin'] })

const recoleta = localFont({
  src: '../assets/font/Recoleta.otf',
  variable: '--font-recoleta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sebarz | Web Developer',
  description: 'Sebastian Ruiz - Full Stack Web Developer Portfolio',
  keywords: ['web developer', 'full stack', 'react', 'javascript', 'portfolio'],
  authors: [{ name: 'Sebastian Ruiz' }],
  creator: 'Sebastian Ruiz',
  metadataBase: new URL('https://imsebarz.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://imsebarz.vercel.app',
    title: 'Sebarz | Web Developer',
    description: 'Sebastian Ruiz - Full Stack Web Developer Portfolio',
    siteName: 'Sebarz Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sebarz | Web Developer',
    description: 'Sebastian Ruiz - Full Stack Web Developer Portfolio',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${recoleta.variable}`}>
        {children}
      </body>
    </html>
  )
}

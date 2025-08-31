import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import '../styles/globals.scss'
import StructuredData from '@/components/StructuredData'
import LanguageSwitch from '@/components/LanguageSwitch'
import { buildBaseMetadata } from '@/lib/seo'
import { LocaleProvider } from '@/contexts/LocaleContext'

const inter = Inter({ subsets: ['latin'] })

const recoleta = localFont({
  src: '../../public/fonts/Recoleta.otf',
  variable: '--font-recoleta',
  display: 'swap',
})

// We'll export base English metadata; locale segment adds its own.
export const metadata: Metadata = buildBaseMetadata('en')

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const headerLocale = hdrs.get('x-locale') === 'es' ? 'es' : 'en'
  // Determine lang on server via pathname. In App Router we can read from headers only; simpler: infer from first segment in children tree via a data attribute we set on locale pages (future). For now, default 'en'; /es segment provides its own metadata & structured data uses getLocale client-side.
  return (
    <html lang={headerLocale}>
      <body className={`${inter.className} ${recoleta.variable}`}>
        <LocaleProvider initialLocale={headerLocale}>
          <StructuredData locale={headerLocale} />
          <LanguageSwitch initialLocale={headerLocale} />
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}

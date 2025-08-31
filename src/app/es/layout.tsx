// Nested locale layout: we intentionally DO NOT render <html>/<body> here to avoid
// nested document elements (hydration error). Root layout handles fonts & structure.
// Only provide locale-specific metadata so Next.js can merge it.
import type { Metadata } from 'next'
import { buildBaseMetadata } from '@/lib/seo'

export const metadata: Metadata = buildBaseMetadata('es')

// The root layout already provides LocaleProvider & LanguageSwitch based on middleware header.
export default function SpanishLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

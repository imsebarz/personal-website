import type { Metadata } from 'next'
import rawSeoConfig from '@/data/seo.json'
import projectsData from '@/data/projects.json'

// Base site URL from env or fallback
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://imsebarz.vercel.app').replace(/\/$/, '')

// Helper: sanitize text (trim & collapse whitespace)
const clean = (value: string) => value.replace(/\s+/g, ' ').trim()

interface ExtendedSeoConfig {
  siteName: string
  defaultTitle: string
  titleTemplate: string
  tagline: string
  taglineEs?: string
  description: string
  descriptionEs?: string
  shortDescription: string
  keywords: string[]
  author: { name: string; url: string; email: string; sameAs: string[] }
  social: { github: string; linkedin: string; twitter: string }
  language: string
  locale: string
  alternateLocales?: string[]
  supportedLanguages?: string[]
  defaultLanguage?: string
}

const seoConfig: ExtendedSeoConfig = rawSeoConfig as ExtendedSeoConfig

export const buildBaseMetadata = (locale: string = 'en'): Metadata => {
  const isEs = locale === 'es'
  const title = seoConfig.defaultTitle + (isEs ? ' (ES)' : '')
  const description = isEs && seoConfig.descriptionEs ? seoConfig.descriptionEs : seoConfig.description
  const images = [
    {
      url: `${SITE_URL}/images/hero.webp`,
      width: 1200,
      height: 800,
  alt: clean(isEs && seoConfig.taglineEs ? seoConfig.taglineEs : seoConfig.tagline),
    },
  ]

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: seoConfig.titleTemplate,
    },
    description,
    applicationName: seoConfig.siteName,
    keywords: seoConfig.keywords,
    authors: [{ name: seoConfig.author.name, url: seoConfig.author.url }],
    creator: seoConfig.author.name,
    publisher: seoConfig.author.name,
    alternates: {
      canonical: isEs ? '/es' : '/',
      languages: {
        'en-US': '/',
        'es-ES': '/es',
      },
    },
    openGraph: {
      type: 'website',
      locale: seoConfig.locale,
      url: SITE_URL,
      siteName: seoConfig.siteName,
      title,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      creator: `@${seoConfig.social.twitter}`,
      site: `@${seoConfig.social.twitter}`,
      title,
      description,
      images,
    },
    category: 'technology',
    manifest: '/site.webmanifest',
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      other: [
        { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
  }
}

// Generate structured data objects (not stringified) for JSON-LD
// Schema.org minimal type fragments
interface SchemaThing { ['@context']: string; ['@type']: string; [key: string]: unknown }
interface CreativeProjectItem extends SchemaThing { name: string; description?: string; url?: string; keywords?: string }
interface ListItem extends SchemaThing { position: number; item: CreativeProjectItem }
interface ItemList extends SchemaThing { name: string; itemListElement: ListItem[] }

export const buildStructuredData = (locale: string = 'en'): SchemaThing[] => {
  const isEs = locale === 'es'
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: seoConfig.author.name,
    url: SITE_URL,
    image: `${SITE_URL}/images/sebas.webp`,
    description: seoConfig.shortDescription + (isEs ? ' (ES)' : ''),
    sameAs: seoConfig.author.sameAs,
    jobTitle: 'Full Stack Web Developer',
    homeLocation: {
      '@type': 'Place',
      name: 'Medellín, Colombia',
      geo: { '@type': 'GeoCoordinates', latitude: 6.2443382, longitude: -75.573553 },
      address: { '@type': 'PostalAddress', addressLocality: 'Medellín', addressRegion: 'Antioquia', addressCountry: 'CO' }
    },
    areaServed: ['Global', 'Remote', 'Colombia', 'Medellín'],
    worksFor: {
      '@type': 'Organization',
      name: seoConfig.author.name,
    },
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.siteName,
    url: SITE_URL,
  description: isEs && seoConfig.descriptionEs ? seoConfig.descriptionEs : seoConfig.description,
    inLanguage: seoConfig.language,
  availableLanguage: seoConfig.supportedLanguages,
  }

  const webpage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
  name: isEs ? seoConfig.defaultTitle + ' (ES)' : seoConfig.defaultTitle,
    url: SITE_URL,
  description: isEs && seoConfig.descriptionEs ? seoConfig.descriptionEs : seoConfig.description,
    isPartOf: { '@id': SITE_URL + '#website' },
    primaryImageOfPage: `${SITE_URL}/images/hero.webp`,
    dateModified: new Date().toISOString(),
  }

  // Extract featured & all projects
  const allProjects = (projectsData as { projects?: { name: string; description: string; demo?: string; githubRepo?: string; tags?: string[] }[] }).projects || []
  const projectItems: CreativeProjectItem[] = allProjects.map((p) => ({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.name.replace(/^[^\w]+/, '').trim(),
    description: p.description,
    url: p.demo || p.githubRepo || SITE_URL,
    keywords: Array.isArray(p.tags) ? p.tags.join(', ') : undefined,
  }))

  const projectCollection: ItemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Projects',
    itemListElement: projectItems.map((item, index): ListItem => ({
      '@context': 'https://schema.org',
      '@type': 'ListItem',
      position: index + 1,
      item,
    })),
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Projects', item: SITE_URL + '#projects' },
      { '@type': 'ListItem', position: 3, name: 'Contact', item: SITE_URL + '#contact' },
    ],
  }

  const place: SchemaThing = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: 'Medellín, Colombia',
    geo: { '@type': 'GeoCoordinates', latitude: 6.2443382, longitude: -75.573553 },
    address: { '@type': 'PostalAddress', addressLocality: 'Medellín', addressRegion: 'Antioquia', addressCountry: 'CO' }
  }
  return [person, website, webpage, projectCollection, breadcrumb, place]
}

// Helper to stringify for script tag
export const getStructuredDataScript = (locale: string = 'en'): string => JSON.stringify(buildStructuredData(locale))

// Accessible alt text (strip emojis & trim)
export const buildAccessibleAlt = (name: string, fallback?: string) => {
  if (!name) return fallback || 'Project image'
  // Remove common emoji / symbol ranges & stray punctuation while keeping basic letters, numbers & some punctuation
  const noEmoji = name
    .replace(/[\u2700-\u27BF]/g, '') // Dingbats
    .replace(/[\uE000-\uF8FF]/g, '') // Private use
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // Surrogate pairs (emojis)
    .replace(/[^A-Za-z0-9 .,!'"@#&_()\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return noEmoji || fallback || 'Project image'
}

export interface SeoHelperExports {
  buildBaseMetadata: (locale?: string) => Metadata
  buildStructuredData: (locale?: string) => SchemaThing[]
  getStructuredDataScript: (locale?: string) => string
  buildAccessibleAlt: (name: string, fallback?: string) => string
}

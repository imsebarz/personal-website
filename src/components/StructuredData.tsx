import React from 'react'
import { getStructuredDataScript } from '@/lib/seo'

interface StructuredDataProps { locale: 'en' | 'es' }

// Pure server component injecting JSON-LD structured data using server-resolved locale
const StructuredData = ({ locale }: StructuredDataProps) => {
  const json = getStructuredDataScript(locale)
  return (
    <script
      id="structured-data"
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}

export default StructuredData

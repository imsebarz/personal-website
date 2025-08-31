import { buildBaseMetadata, buildStructuredData, buildAccessibleAlt } from '@/lib/seo'

describe('SEO utilities', () => {
  it('buildBaseMetadata returns required core fields', () => {
    const meta = buildBaseMetadata()
    expect(meta.title).toBeDefined()
    expect(meta.description).toBeTruthy()
  const ogImages = meta.openGraph?.images
  const count = Array.isArray(ogImages) ? ogImages.length : (ogImages ? 1 : 0)
  expect(count).toBeGreaterThan(0)
  })

  it('buildStructuredData returns array with Person, WebSite and Place for ES locale', () => {
    const data = buildStructuredData('es')
    const types = data.map(d => d['@type'])
    expect(types).toContain('Person')
    expect(types).toContain('WebSite')
    expect(types).toContain('Place')
  })

  it('buildAccessibleAlt strips emojis', () => {
    const alt = buildAccessibleAlt('🎮 Game Project')
    expect(alt).toBe('Game Project')
  })
})

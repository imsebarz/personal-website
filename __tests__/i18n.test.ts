import { buildBaseMetadata, buildStructuredData, getStructuredDataScript } from '@/lib/seo'
import esAbout from '@/data/aboutme.es.json'
import esNav from '@/data/nav.es.json'
import enNav from '@/data/nav.json'
import esContact from '@/data/contact.es.json'
import enContact from '@/data/contact.json'

describe('i18n data integrity', () => {
  it('Spanish about me strings have required keys and non-empty values', () => {
    type ESAbout = typeof esAbout
    const required: (keyof ESAbout)[] = [
      'hero', 'aboutMeTitle', 'aboutMeText1', 'aboutMeText2', 'aboutMeText3', 'aboutMeText4', 'aboutMeText5', 'someTechnologiesTitle', 'technologies'
    ]
    required.forEach(k => {
      const value = esAbout[k]
      expect(value).toBeTruthy()
    })
    expect(Array.isArray(esAbout.technologies)).toBe(true)
    expect(esAbout.technologies.length).toBeGreaterThan(5)
  })

  it('Navigation Spanish vs English have same link keys', () => {
    const esKeys = Object.keys(esNav.links).sort()
    const enKeys = Object.keys(enNav.links).sort()
    expect(esKeys).toEqual(enKeys)
  })

  it('Contact Spanish contains matching social structure', () => {
    expect(Object.keys(esContact.socials).sort()).toEqual(Object.keys(enContact.socials).sort())
  })
})

describe('SEO localization', () => {
  it('buildBaseMetadata returns different descriptions and canonical per locale', () => {
    const en = buildBaseMetadata('en')
    const es = buildBaseMetadata('es')
    expect(en.description).toBeDefined()
    expect(es.description).toBeDefined()
    expect(en.description).not.toEqual(es.description)
    expect(en.alternates?.canonical).toBe('/')
    expect(es.alternates?.canonical).toBe('/es')
    // Title tag adds (ES) suffix
    // @ts-expect-error Next metadata union type
    expect(typeof es.title === 'object' ? es.title.default : es.title).toMatch(/\(ES\)/)
  })

  it('Spanish structured data includes Place and localized Person description', () => {
    const data = buildStructuredData('es')
    const types = data.map(d => d['@type'])
    expect(types).toContain('Place')
  const person = data.find(d => d['@type'] === 'Person') as { description?: unknown } | undefined
  expect(typeof person?.description).toBe('string')
  expect(String(person?.description)).toMatch(/\(ES\)/)
  })

  it('Structured data script (es) contains Medellín geo coordinates', () => {
    const json = getStructuredDataScript('es')
    expect(json).toMatch(/Medellín/)
    expect(json).toMatch(/6\.2443382/)
    expect(json).toMatch(/-75\.573553/)
  })
})

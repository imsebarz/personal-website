import { useState, useEffect } from 'react'
import type { Project, PersonalInfo, NavigationLinks, ContactInfo, Sections } from '@/types'
import { getLocale } from '@/lib/locale'

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const locale = getLocale()
        const response = await (locale === 'es'
          ? import('@/data/projects.es.json')
          : import('@/data/projects.json'))
        setProjects(response.projects || response.default?.projects || [])
      } catch (_err) {
        setError('Error loading projects')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  return { projects, loading, error }
}

export const usePersonalInfo = () => {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPersonalInfo = async () => {
      try {
        const locale = getLocale()
        const response = await (locale === 'es'
          ? import('@/data/aboutme.es.json')
          : import('@/data/aboutme.json'))
        setPersonalInfo(response.default)
      } catch (_err) {
        setError('Error loading personal info')
      } finally {
        setLoading(false)
      }
    }

    loadPersonalInfo()
  }, [])

  return { personalInfo, loading, error }
}

export const useNavigation = () => {
  const [navigation, setNavigation] = useState<NavigationLinks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        const locale = getLocale()
        const response = await (locale === 'es'
          ? import('@/data/nav.es.json')
          : import('@/data/nav.json'))
        setNavigation(response.default)
      } catch (_err) {
        setError('Error loading navigation')
      } finally {
        setLoading(false)
      }
    }

    loadNavigation()
  }, [])

  return { navigation, loading, error }
}

export const useContact = () => {
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContact = async () => {
      try {
        const locale = getLocale()
        const response = await (locale === 'es'
          ? import('@/data/contact.es.json')
          : import('@/data/contact.json'))
        setContact(response.default)
      } catch (_err) {
        setError('Error loading contact info')
      } finally {
        setLoading(false)
      }
    }

    loadContact()
  }, [])

  return { contact, loading, error }
}

export const useSections = () => {
  const [sections, setSections] = useState<Sections | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const load = async () => {
      try {
        const locale = getLocale()
        const data = await (locale === 'es'
          ? import('@/data/sections.es.json')
          : import('@/data/sections.en.json'))
        setSections(data.default)
      } catch (_err) {
        setError('Error loading sections')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
  return { sections, loading, error }
}

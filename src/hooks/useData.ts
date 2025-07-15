import { useState, useEffect } from 'react'
import type { Project, PersonalInfo, NavigationLinks, ContactInfo } from '@/types'

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await import('@/data/projects.json')
        setProjects(response.projects)
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
        const response = await import('@/data/aboutme.json')
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
        const response = await import('@/data/nav.json')
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
        const response = await import('@/data/contact.json')
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

import { useState, useEffect } from 'react'
import type { Project, PersonalInfo, NavigationLinks, ContactInfo } from '@/types'

// Hook para cargar datos de proyectos
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await import('@/data/projects.json')
        setProjects(response.projects)
      } catch (err) {
        setError('Error loading projects')
        console.error('Error loading projects:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  return { projects, loading, error }
}

// Hook para cargar información personal
export const usePersonalInfo = () => {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPersonalInfo = async () => {
      try {
        const response = await import('@/data/aboutme.json')
        setPersonalInfo(response.default)
      } catch (err) {
        setError('Error loading personal info')
        console.error('Error loading personal info:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPersonalInfo()
  }, [])

  return { personalInfo, loading, error }
}

// Hook para cargar datos de navegación
export const useNavigation = () => {
  const [navigation, setNavigation] = useState<NavigationLinks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        const response = await import('@/data/nav.json')
        setNavigation(response.default)
      } catch (err) {
        setError('Error loading navigation')
        console.error('Error loading navigation:', err)
      } finally {
        setLoading(false)
      }
    }

    loadNavigation()
  }, [])

  return { navigation, loading, error }
}

// Hook para cargar datos de contacto
export const useContact = () => {
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContact = async () => {
      try {
        const response = await import('@/data/contact.json')
        setContact(response.default)
      } catch (err) {
        setError('Error loading contact info')
        console.error('Error loading contact info:', err)
      } finally {
        setLoading(false)
      }
    }

    loadContact()
  }, [])

  return { contact, loading, error }
}

// Tipos para los proyectos
export interface Project {
  id: number
  name: string
  description: string
  tags: string[]
  img: string
  githubRepo?: string
  demo?: string
  featured?: boolean
}

// Tipos para la información personal
export interface PersonalInfo {
  hero: {
    greeting: string
    name: string
    description: string
    buttonText: string
  }
  aboutMeText1: string
  aboutMeText2: string
  aboutMeText3: string
  aboutMeText4: string
  aboutMeText5: string
  someTechnologiesTitle: string
  technologies: string[]
}

// Tipos para navegación
export interface NavigationLinks {
  name: string
  links: {
    aboutMe: string
    featuredProjects: string
    projects: string
    contact: string
    resume: string
  }
  resumeLink: string
}

// Tipos para contacto y redes sociales
export interface ContactInfo {
  contactTitle: string
  contactText: string
  contactButton: string
  socials: {
    behance: string
    github: string
    linkedin: string
    twitter: string
    instagram: string
    mail: string
    username: string
  }
}

// Tipos para componentes de animación
export interface AnimationVariants {
  hidden: {
    opacity: number
    y?: number
    x?: number
    scale?: number
  }
  visible: {
    opacity: number
    y?: number
    x?: number
    scale?: number
    transition?: {
      duration?: number
      delay?: number
      ease?: string
      staggerChildren?: number
    }
  }
}

// Props comunes para componentes
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Props para componentes de proyecto
export interface ProjectComponentProps extends BaseComponentProps {
  project: Project
  isReversed?: boolean
}

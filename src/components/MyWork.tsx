'use client'

import React from 'react'
import '@/styles/mywork.scss'
import { useProjects, useSections } from '@/hooks/useData'
import { useLocale } from '@/contexts/LocaleContext'
import Project from './Project'

const MyWork: React.FC = () => {
  const { projects } = useProjects()
  const { sections } = useSections()
  useLocale()
  if (!sections) return null

  return (
    <section className="mywork" id="mywork">
  <h1 className="title">{sections.otherWork}</h1>
      <div className="mywork-container">
        {projects.map((item) => {
          if (!item.featured) {
            return <Project {...item} key={item.id} />
          }
          return null
        })}
      </div>
    </section>
  )
}

export default MyWork

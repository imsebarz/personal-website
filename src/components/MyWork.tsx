'use client'

import React from 'react'
import '@/styles/mywork.scss'
import Project from './Project'
import Projects from '@/data/projects.json'
import type { Project as ProjectType } from '@/types'

const { projects }: { projects: ProjectType[] } = Projects

const MyWork: React.FC = () => {
  return (
    <section className="mywork" id="mywork">
      <h1 className="title">Some other work</h1>
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

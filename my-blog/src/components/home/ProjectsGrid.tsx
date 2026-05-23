'use client'

import { Github, ExternalLink, Star, Zap, Code2, Bot } from 'lucide-react'
import { getProjects, getProjectsMeta, getCtaLabels } from '@/data/projects'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot,
  Zap,
  Code2,
}

interface ProjectsGridProps {
  locale: string
}

export default function ProjectsGrid({ locale }: ProjectsGridProps) {
  const projects = getProjects(locale)
  const meta = getProjectsMeta(locale)
  const cta = getCtaLabels(locale)

  return (
    <section className="py-24 md:py-32">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            {meta.pageTitle}
          </h2>
          <p className="text-text-secondary text-base max-w-2xl mx-auto">
            {meta.pageSubtitle}
          </p>
        </div>

        {/* Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const IconComponent = iconMap[project.icon] || Bot

            return (
              <article
                key={project.slug}
                className="group relative flex flex-col rounded-2xl bg-bg-secondary/50 border border-border hover:border-border-hover transition-all duration-300 hover:shadow-xl hover:shadow-black/20 overflow-hidden"
              >
                {/* Gradient Top Border */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${project.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${project.gradient} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    {project.stars && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-bg-tertiary/50 text-xs text-text-secondary">
                        <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
                        {project.stars}
                      </div>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-accent-blue transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4 flex-1">
                    {project.description}
                  </p>

                  {/* Problem/Solution */}
                  <div className="space-y-2 mb-4 p-3 rounded-lg bg-bg-tertiary/30 text-xs">
                    <div>
                      <span className="text-accent-blue font-medium">{locale === 'ja' ? '課題: ' : locale === 'zh' ? '课题: ' : 'Problem: '}</span>
                      <span className="text-text-muted">{project.problem}</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan font-medium">{locale === 'ja' ? '挑戦: ' : locale === 'zh' ? '挑战: ' : 'Challenge: '}</span>
                      <span className="text-text-muted">{project.challenge}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-bg-tertiary/50 text-text-muted text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Links */}
                  <div className="flex items-center gap-3 pt-3 border-t border-border">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                      >
                        <Github className="w-3.5 h-3.5" />
                        {cta.code}
                      </a>
                    )}
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {cta.demo}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
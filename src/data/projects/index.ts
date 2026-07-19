import { projects as enProjects, projectsMeta as enMeta, ctaLabels as enCta } from './en'
import { projects as jaProjects, projectsMeta as jaMeta, ctaLabels as jaCta } from './ja'
import { projects as zhProjects, projectsMeta as zhMeta, ctaLabels as zhCta } from './zh'

type Locale = 'en' | 'ja' | 'zh'

const dataMap: Record<Locale, { projects: typeof enProjects; projectsMeta: typeof enMeta; ctaLabels: typeof enCta }> = {
  en: { projects: enProjects, projectsMeta: enMeta, ctaLabels: enCta },
  ja: { projects: jaProjects, projectsMeta: jaMeta, ctaLabels: jaCta },
  zh: { projects: zhProjects, projectsMeta: zhMeta, ctaLabels: zhCta },
}

export function getProjects(locale: string) {
  const data = dataMap[locale as Locale] || dataMap.en
  return data.projects
}

export function getProjectsMeta(locale: string) {
  const data = dataMap[locale as Locale] || dataMap.en
  return data.projectsMeta
}

export function getCtaLabels(locale: string) {
  const data = dataMap[locale as Locale] || dataMap.en
  return data.ctaLabels
}

export { projectsMeta, projects, ctaLabels } from './en'
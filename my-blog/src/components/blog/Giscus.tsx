'use client'

import { useEffect, useRef } from 'react'

interface GiscusProps {
  repo: string
  repoId: string
  category: string
  categoryId: string
  mapping: string
  reactionsEnabled: string
  emitMetadata: string
  inputPosition: string
  lang: string
}

export default function Giscus({
  repo = 'dingfeng901228-oss/fblog',
  repoId = 'R_kgDOSh6a4g',
  category = 'Comments',
  categoryId = 'DIC_kwDOSh6a4s4C9pw5',
  mapping = 'pathname',
  reactionsEnabled = '1',
  emitMetadata = '0',
  inputPosition = 'bottom',
  lang = 'ja',
}: Partial<GiscusProps>) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    // Clear previous giscus
    ref.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', repo)
    script.setAttribute('data-repo-id', repoId)
    script.setAttribute('data-category', category)
    script.setAttribute('data-category-id', categoryId)
    script.setAttribute('data-mapping', mapping)
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', reactionsEnabled)
    script.setAttribute('data-emit-metadata', emitMetadata)
    script.setAttribute('data-input-position', inputPosition)
    script.setAttribute('data-theme', 'preferred_color_scheme')
    script.setAttribute('data-lang', lang)
    script.setAttribute('data-loading', 'lazy')
    script.crossOrigin = 'anonymous'
    script.async = true

    ref.current.appendChild(script)
  }, [repo, repoId, category, categoryId, mapping, reactionsEnabled, emitMetadata, inputPosition, lang])

  return <div ref={ref} className="giscus mt-16 pt-8 border-t border-border" />
}
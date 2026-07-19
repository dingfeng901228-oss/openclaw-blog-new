'use client'

import { useEffect, useRef, useState } from 'react'

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
  repo = 'dingfeng901228-oss/openclaw-blog-new',
  repoId = 'R_kgDOSl1elg',
  category = 'General',
  categoryId = 'DIC_kwDOSl1els4C92OH',
  reactionsEnabled = '1',
  emitMetadata = '0',
  inputPosition = 'bottom',
  lang = 'ja',
}: Partial<GiscusProps>) {
  const ref = useRef<HTMLDivElement>(null)
  const [term, setTerm] = useState('/')

  useEffect(() => {
    // Strip locale prefix so /zh/blog/slug, /ja/blog/slug, /en/blog/slug share the same discussion
    const stripped = window.location.pathname.replace(/^\/(ja|zh|en)\//, '/')
    setTerm(stripped)

    if (!ref.current) return

    // Clear previous giscus
    ref.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', repo)
    script.setAttribute('data-repo-id', repoId)
    script.setAttribute('data-category', category)
    script.setAttribute('data-category-id', categoryId)
    script.setAttribute('data-mapping', 'specific')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', reactionsEnabled)
    script.setAttribute('data-emit-metadata', emitMetadata)
    script.setAttribute('data-input-position', inputPosition)
    script.setAttribute('data-theme', 'preferred_color_scheme')
    script.setAttribute('data-lang', lang)
    script.setAttribute('data-loading', 'lazy')
    script.setAttribute('data-term', stripped)
    script.crossOrigin = 'anonymous'
    script.async = true

    ref.current.appendChild(script)
  }, [repo, repoId, category, categoryId, reactionsEnabled, emitMetadata, inputPosition, lang])

  return <div ref={ref} className="giscus mt-16 pt-8 border-t border-border" />
}
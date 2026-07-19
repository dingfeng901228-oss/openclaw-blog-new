import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['ja', 'zh', 'en'],
  defaultLocale: 'ja',
  localePrefix: 'always',
})

export default function middleware(request: NextRequest) {
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
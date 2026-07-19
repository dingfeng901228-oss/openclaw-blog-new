import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !['ja', 'zh', 'en'].includes(locale)) {
    locale = 'ja'
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
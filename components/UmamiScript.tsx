'use client'

import Script from 'next/script'

/**
 * Umami Analytics Script Component
 * Privacy-focused analytics using Umami
 */
export function UmamiScript() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL

  // Only load Umami if both website ID and URL are configured
  if (!websiteId || !umamiUrl) {
    return null
  }

  return (
    <Script
      async
      defer
      data-website-id={websiteId}
      src={`${umamiUrl}/script.js`}
      strategy="afterInteractive"
    />
  )
}

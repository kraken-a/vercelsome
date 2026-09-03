import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import '../globals.css'
import {CartProvider} from '@/features/cart/context'
import {WishlistProvider} from '@/features/wishlist/context'
import '@/css/style.css'
import '@/css/stitch-polish.css'
import '@/css/a11y-focus.css'
import { PromoBar } from '@/components/layout/promo-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HelpFab } from '@/components/layout/help-fab'
import { LayoutChrome } from '@/components/layout/layout-chrome'
import { CartOverlay } from '@/components/layout/cart-overlay'
import { NotificationsProvider } from '@/features/notifications/context'
import { AuthProvider } from '@/features/auth/context'
import { ToastProvider } from '@/features/toast/context'
import { ProjectIdCapture } from '@/components/layout/project-id-capture'
import Script from 'next/script'
import {
  axeptioInitSnippet,
  axeptioBridgeSnippet,
  cookiesVersionForLocale,
  isValidAxeptioClientId,
} from '@/features/tracking/axeptio'
import {
  isValidMetaPixelId,
  metaPixelInitSnippet,
  metaPixelConsentBridgeSnippet,
} from '@/features/tracking/meta-pixel'
import { resolveLocaleAlternates } from '@/lib/seo/page-metadata'
import { getTrackingConfig } from '@/lib/tracking-config'
import { CookieBanner } from '@/components/layout/cookie-banner'
import "bootstrap/dist/css/bootstrap-grid.min.css"

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || ''
const AXEPTIO_CLIENT_ID = process.env.NEXT_PUBLIC_AXEPTIO_CLIENT_ID || ''
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''

const yetGrotesk = localFont({
  src: [
    {
      path: '../../../public/fonts/for-yetgroteskweb-medium.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/for-yetgroteskweb-bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-body',
  display: 'swap',
})

const ppAirMono = localFont({
  src: [
    {
      path: '../../../public/fonts/PPAir-RegularMono.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-mono',
  display: 'swap',
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta.root' })
  const { canonical, languages } = resolveLocaleAlternates(locale, '/')
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical, languages },
  }
}

type Props = {
  readonly children: React.ReactNode
  readonly params: Promise<{ locale: string }>
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  const messages = await getMessages()
  const nonce = (await headers()).get('x-nonce') ?? ''
  const tracking = await getTrackingConfig()
  const GTM_ID = tracking.gtmContainerId
  const AXEPTIO_CLIENT_ID = tracking.axeptioClientId
  const META_PIXEL_ID = tracking.metaPixelId

  return (
    <html lang={locale} className={`${yetGrotesk.variable} ${ppAirMono.variable}`} suppressHydrationWarning>
      <head>
        {GTM_ID && (
          <script
            id="gtm-consent-default"
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});` }}
          />
        )}
        {isValidAxeptioClientId(AXEPTIO_CLIENT_ID) && (
          <script
            id="axeptio-loader"
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: axeptioInitSnippet(AXEPTIO_CLIENT_ID, cookiesVersionForLocale(locale)) }}
          />
        )}
        {isValidAxeptioClientId(AXEPTIO_CLIENT_ID) && (
          <script
            id="axeptio-bridge"
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: axeptioBridgeSnippet() }}
          />
        )}
        {GTM_ID && (
          <script
            id="gtm-loader"
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');` }}
          />
        )}
        {isValidMetaPixelId(META_PIXEL_ID) && (
          <script
            id="meta-pixel-consent-bridge"
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: metaPixelConsentBridgeSnippet() }}
          />
        )}
        {isValidMetaPixelId(META_PIXEL_ID) && (
          <script
            id="meta-pixel-init"
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: metaPixelInitSnippet(META_PIXEL_ID) }}
          />
        )}
          {/*<link rel="stylesheet" href="http://localhost:8069/im_livechat/assets_embed.css"/>*/}
      </head>
      <body className="bg-creme text-noir font-body antialiased">
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <NextIntlClientProvider messages={messages}>
            <AuthProvider>
                <NotificationsProvider>
                    <ToastProvider>
                        <CartProvider>
                            <WishlistProvider>
                                <Suspense fallback={null}>
                                    <ProjectIdCapture />
                                </Suspense>
                                <LayoutChrome
                                    promo={<PromoBar/>}
                                    header={<Header/>}
                                    footer={<Footer/>}
                                >
                                    {children}
                                </LayoutChrome>
                                <CartOverlay/>
                                {!AXEPTIO_CLIENT_ID && <CookieBanner/>}
                            </WishlistProvider>
                        </CartProvider>
                    </ToastProvider>
                </NotificationsProvider>
            </AuthProvider>
        </NextIntlClientProvider>

        <Script
            id="odoo-livechat-loader"
            src={`https://cdn.oaksome.com/im_livechat/loader/${process.env.NEXT_PUBLIC_LIVECHAT_CHANNEL ?? '2'}`}
            strategy="afterInteractive"
            nonce={nonce}
        />
        <Script
            id="odoo-livechat-embed-bundle"
            src="https://cdn.oaksome.com/im_livechat/assets_embed.js"
            strategy="afterInteractive"
            nonce={nonce}
        />
        <Script
            id="oaksome-livechat-overrides"
            src="/js/livechat-ui_override.js"
            strategy="afterInteractive"
            nonce={nonce}
        />
      </body>
    </html>
  )
}

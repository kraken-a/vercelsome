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
import { resolveLocaleAlternates } from '@/lib/seo/page-metadata'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || ''
const AXEPTIO_CLIENT_ID = process.env.NEXT_PUBLIC_AXEPTIO_CLIENT_ID || ''

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

  return (
    <html lang={locale} className={`${yetGrotesk.variable} ${ppAirMono.variable}`}>
      <head>
        {GTM_ID && (
          <Script id="gtm-consent-default" strategy="beforeInteractive" nonce={nonce}>
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`}
          </Script>
        )}
        {isValidAxeptioClientId(AXEPTIO_CLIENT_ID) && (
          <Script id="axeptio-loader" strategy="beforeInteractive" nonce={nonce}>
            {axeptioInitSnippet(AXEPTIO_CLIENT_ID, cookiesVersionForLocale(locale))}
          </Script>
        )}
        {isValidAxeptioClientId(AXEPTIO_CLIENT_ID) && (
          <Script id="axeptio-bridge" strategy="afterInteractive" nonce={nonce}>
            {axeptioBridgeSnippet()}
          </Script>
        )}
        {GTM_ID && (
          <Script id="gtm-loader" strategy="afterInteractive" nonce={nonce}>
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}
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
                            </WishlistProvider>
                        </CartProvider>
                    </ToastProvider>
                </NotificationsProvider>
            </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

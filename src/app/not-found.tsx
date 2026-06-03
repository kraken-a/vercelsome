import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import localFont from 'next/font/local'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/header'
import Assurance from "@/components/assurance/assurance";
import Footer from '@/components/footer/footer'
import { AuthProvider } from '@/features/auth/context'
import { NotificationsProvider } from '@/features/notifications/context'
import { ToastProvider } from '@/features/toast/context'
import { CartProvider } from '@/features/cart/context'
import { WishlistProvider } from '@/features/wishlist/context'
import './globals.css'
import '@/css/style.css'
import '@/css/stitch-polish.css'
import './not-found.css'

const yetGrotesk = localFont({
  src: [
    { path: '../../public/fonts/for-yetgroteskweb-medium.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/for-yetgroteskweb-bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
})

const ppAirMono = localFont({
  src: [{ path: '../../public/fonts/PPAir-RegularMono.woff2', weight: '400', style: 'normal' }],
  variable: '--font-mono',
  display: 'swap',
})

export default async function NotFound() {
  const locale = await getLocale()
  const messages = await getMessages()
  const t = await getTranslations({ locale, namespace: 'notFound' })

  return (
    <html lang={locale} className={`${yetGrotesk.variable} ${ppAirMono.variable}`}>
      <body className="bg-creme text-noir font-body antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <NotificationsProvider>
              <ToastProvider>
                <CartProvider>
                  <WishlistProvider>
                    <Header />
                    <section className="error-hero">
                      <div className="error-hero-inner">
                        <div className="error-illustration">🏠</div>
                        <div className="error-label">{t('errorCode')}</div>
                        <h1>{t('h1')}</h1>
                        <p>{t('intro')}</p>

                        <div className="error-cards">
                          <Link href="/collections" className="error-card">
                            <span className="error-card-icon">🪑</span>
                            <h3>{t('card1_title')}</h3>
                            <span className="card-desc">{t('card1_desc')}</span>
                          </Link>
                          <Link href="/configurer" className="error-card">
                            <span className="error-card-icon"></span>
                            <h3>{t('card2_title')}</h3>
                            <span className="card-desc">{t('card2_desc')}</span>
                          </Link>
                          <Link href="/contact" className="error-card">
                            <span className="error-card-icon"></span>
                            <h3>{t('card3_title')}</h3>
                            <span className="card-desc">{t('card3_desc')}</span>
                          </Link>
                        </div>

                        <div className="error-search">
                          <span className="error-search-icon"></span>
                          <input type="text" placeholder={t('search_placeholder')} disabled />
                        </div>

                        <Link href="/" className="error-home-link">{t('back_home')}</Link>
                      </div>
                    </section>
                    <Assurance />
                    <Footer />
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

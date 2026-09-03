import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'nl', 'en'] as const,
  defaultLocale: 'fr',
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/acheter': {
      fr: '/acheter',
      nl: '/kopen',
      en: '/buy',
    },
    '/gamme': {
      fr: '/gamme',
      nl: '/materialen',
      en: '/materials',
    },
    '/gamme/[slug]': {
      fr: '/gamme/[slug]',
      nl: '/gamma/[slug]',
      en: '/range/[slug]',
    },
    '/espaces': {
      fr: '/espaces',
      nl: '/ruimtes',
      en: '/spaces',
    },
    '/espace/[slug]': {
      fr: '/espace/[slug]',
      nl: '/ruimte/[slug]',
      en: '/space/[slug]',
    },
    '/collections': {
      fr: '/collections',
      nl: '/collecties',
      en: '/collections',
    },
    '/collection/[slug]': {
      fr: '/collection/[slug]',
      nl: '/collectie/[slug]',
      en: '/collection/[slug]',
    },
    '/produit/[id]': {
      fr: '/produit/[id]',
      nl: '/meubel/[id]',
      en: '/product/[id]',
    },
    '/configurer': {
      fr: '/configurer',
      nl: '/configureren',
      en: '/configure',
    },
    '/inspirations': {
      fr: '/inspirations',
      nl: '/inspiraties',
      en: '/inspirations',
    },
    '/etudes-de-cas': {
      fr: '/etudes-de-cas',
      nl: '/casestudies',
      en: '/case-studies',
    },
    '/etude-de-cas/[slug]': {
      fr: '/etude-de-cas/[slug]',
      nl: '/casestudy/[slug]',
      en: '/case-study/[slug]',
    },
    '/echantillons': {
      fr: '/echantillons',
      nl: '/stalen',
      en: '/samples',
    },
    '/commandes': {
      fr: '/commandes',
      nl: '/bestellingen',
      en: '/orders',
    },
    '/commandes/[id]': {
      fr: '/commandes/[id]',
      nl: '/bestellingen/[id]',
      en: '/orders/[id]',
    },
    '/commandes/[id]/rendez-vous': {
      fr: '/commandes/[id]/rendez-vous',
      nl: '/bestellingen/[id]/afspraak',
      en: '/orders/[id]/appointment',
    },
    '/rendez-vous': {
      fr: '/rendez-vous',
      nl: '/afspraken',
      en: '/appointments',
    },
    '/rendez-vous/prendre': {
      fr: '/rendez-vous/prendre',
      nl: '/afspraken/maken',
      en: '/appointments/book',
    },
    '/profile': {
      fr: '/profile',
      nl: '/profiel',
      en: '/profile',
    },
    '/pro/inscription': {
      fr: '/pro/inscription',
      nl: '/pro/registratie',
      en: '/pro/registration',
    },
    '/landing': '/landing',
    '/login': '/login',
    '/register': {
      fr: '/register',
      nl: '/registreren',
      en: '/register',
    },
    '/password-recover': '/password-recover',
    '/password-reset': '/password-reset',
    '/contact': '/contact',
    '/pro': '/pro',
    '/config/[token]': '/config/[token]',
    '/checkout': {
      fr: '/checkout',
      nl: '/afrekenen',
      en: '/checkout',
    },
    '/checkout/success': {
      fr: '/checkout/success',
      nl: '/afrekenen/succes',
      en: '/checkout/success',
    },
    '/wishlist': {
      fr: '/wishlist',
      nl: '/verlanglijst',
      en: '/wishlist',
    },
    '/panier': {
      fr: '/panier',
      nl: '/winkelmand',
      en: '/cart',
    },
    '/faq': '/faq',
    '/a-propos': {
      fr: '/a-propos',
      nl: '/over-ons',
      en: '/about',
    },
    '/comment-ca-marche': {
      fr: '/comment-ca-marche',
      nl: '/hoe-het-werkt',
      en: '/how-it-works',
    },
    '/prise-mesures': {
      fr: '/prises-de-mesures',
      nl: '/opmeten',
      en: '/measurements',
    },
    '/garantie': '/garantie',
    '/livraison': '/livraison',
    '/mentions-legales': '/mentions-legales',
    '/cgv': '/cgv',
    '/cookies': {
      fr: '/pdc-cookies',
      nl: '/cookies',
      en: '/cookies',
    },
    '/return': {
      fr: '/retours',
      nl: '/retour',
      en: '/returns',
    },
    '/engagements': '/engagements',
  },
})

export type Pathnames = keyof typeof routing.pathnames
export type Locale = (typeof routing.locales)[number]

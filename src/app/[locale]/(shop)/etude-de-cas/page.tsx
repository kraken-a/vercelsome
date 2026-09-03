import { redirect } from '@/i18n/navigation'

type Props = {
  readonly params: Promise<{ locale: string }>
}

export default async function EtudeDeCasIndex({ params }: Props) {
  const { locale } = await params
  redirect({ href: '/etudes-de-cas', locale })
}

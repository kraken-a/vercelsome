import type {Metadata} from 'next'
import {InspirationsClient} from './_client'

type Taxonomy = { id: number; name: string }
type InspirationImage = {
    spaces?: Taxonomy[]
    styles?: Taxonomy[]
    categories?: Taxonomy[]
    [key: string]: unknown
}

export const metadata: Metadata = {
    title: 'Inspirations — Oaksome',
    description: "Étude de cas Oaksome. Détails d'une réalisation client.",
}

async function fetchInspirations(locale: string) {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_ODOO_URL}/api/oaksome/v1/inspirations?lang=${locale}`,
            {
                next: {
                    revalidate: 300,
                },
            }
        )

        if (!res.ok) {
            return {
                images: [],
                spaces: [],
                styles: [],
                categories: [],
            }
        }

        const json = await res.json()

        const images = Array.isArray(json)
            ? json
            : Array.isArray(json.data)
                ? json.data
                : []

        const imageList: InspirationImage[] = images

        const spaces = Array.from(
            new Map(
                imageList
                    .flatMap((img) => img.spaces ?? [])
                    .map((space) => [space.id, space] as const)
            ).values()
        ).map((space) => ({
            id: space.id,
            name: space.name,
        }))

        const styles = Array.from(
            new Map(
                imageList
                    .flatMap((img) => img.styles ?? [])
                    .map((style) => [style.id, style] as const)
            ).values()
        ).map((style) => ({
            id: style.id,
            name: style.name,
        }))

        const categories = Array.from(
            new Map(
                imageList
                    .flatMap((img) => img.categories ?? [])
                    .map((category) => [category.id, category] as const)
            ).values()
        ).map((category) => ({
            id: category.id,
            name: category.name,
        }))

        return {
            images,
            spaces,
            styles,
            categories,
        }
    } catch (err) {
        console.error(err)

        return {
            images: [],
            spaces: [],
            styles: [],
            categories: [],
        }
    }
}

type Props = {
    params: Promise<{ locale: string }>
}

export default async function InspirationsPage({params}: Props) {
    const {locale} = await params

    const data = await fetchInspirations(locale)
    console.log('data :',data)
    return <InspirationsClient data={data}/>
}
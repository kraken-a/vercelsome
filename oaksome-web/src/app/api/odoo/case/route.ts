export const revalidate = 3600

import {NextRequest} from 'next/server'
import {apiGet} from '@/lib/api/client'

type RestRelation = {
    id?: number
    name?: string
    slug?: string
}

type RestGallery = {
    id?: number
    image_url?: string
    caption?: string
}

type RestCase = {
    id?: number
    name?: string
    slug?: string
    image_url?: string
    city?: string | null
    min_budget?: number | null
    max_budget?: number | null
    currency?: string | null
    delay_weeks?: number | null
    dim_width?: number | null
    dim_height?: number | null
    dim_depth?: number | null

    description?: string | Record<string, string> | null

    styles?: unknown
    spaces?: unknown
    gallery?: unknown
}

function asArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : []
}

function normalizeCase(item: RestCase) {
    const style_ids = asArray<RestRelation>(item.styles).map((s) => ({
        id: typeof s.id === 'number' ? s.id : 0,
        name: typeof s.name === 'string' ? s.name : '',
        slug: typeof s.slug === 'string' ? s.slug : '',
    }))

    const space_ids = asArray<RestRelation>(item.spaces).map((s) => ({
        id: typeof s.id === 'number' ? s.id : 0,
        name: typeof s.name === 'string' ? s.name : '',
        slug: typeof s.slug === 'string' ? s.slug : '',
    }))

    const gallery_image_ids = asArray<RestGallery>(item.gallery).map((g) => ({
        id: typeof g.id === 'number' ? g.id : 0,
        name: typeof g.caption === 'string' ? g.caption : '',
        image: typeof g.image_url === 'string' ? g.image_url : false,
    }))

    return {
        id: typeof item.id === 'number' ? item.id : 0,
        name: typeof item.name === 'string' ? item.name : '',
        slug: typeof item.slug === 'string' ? item.slug : '',

        image_url:
            typeof item.image_url === 'string'
                ? item.image_url
                : '',

        image:
            typeof item.image_url === 'string'
                ? item.image_url
                : false,

        description:
            typeof item.description === 'string'
                ? item.description
                : (item.description ?? {}),

        city:
            typeof item.city === 'string'
                ? item.city
                : false,

        min_budget:
            typeof item.min_budget === 'number'
                ? item.min_budget
                : false,

        max_budget:
            typeof item.max_budget === 'number'
                ? item.max_budget
                : false,

        currency:
            typeof item.currency === 'string'
                ? item.currency
                : 'EUR',

        currency_id: [
            0,
            typeof item.currency === 'string'
                ? item.currency
                : 'EUR',
        ] as [number, string],

        delay_weeks:
            typeof item.delay_weeks === 'number'
                ? item.delay_weeks
                : false,

        dim_width:
            typeof item.dim_width === 'number'
                ? item.dim_width
                : false,

        dim_height:
            typeof item.dim_height === 'number'
                ? item.dim_height
                : false,

        dim_depth:
            typeof item.dim_depth === 'number'
                ? item.dim_depth
                : false,

        style_ids,
        styles: style_ids,

        space_ids,
        spaces: space_ids,

        gallery_image_ids,
        gallery: gallery_image_ids,
    }
}

export async function GET(request: NextRequest) {
    const slug = request.nextUrl.searchParams.get('slug')

    const path = slug
        ? `/case-studies/${encodeURIComponent(slug)}`
        : '/case-studies'

    const result = await apiGet<unknown>(
        path,
        undefined,
        {revalidate: 3600}
    )

    if (!result.success) {
        return Response.json(
            {error: result.error},
            {status: result.code}
        )
    }

    if (slug) {
        return Response.json(
            normalizeCase(result.data as RestCase)
        )
    }

    return Response.json(
        asArray<RestCase>(result.data).map(normalizeCase)
    )
}

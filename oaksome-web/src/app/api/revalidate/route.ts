export const dynamic = 'force-dynamic'

import { revalidateTag, revalidatePath } from 'next/cache'
import { timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

const VALID_TAGS = [
  'products', 'product', 'collections', 'spaces', 'gammes',
  'navigation', 'home', 'inspirations', 'testimonials', 'samples',
] as const

type ValidTag = typeof VALID_TAGS[number]

const PATH_RE = /^[\w\-\/\[\]]+$/
const PATH_MAX_LEN = 256

function isValidTag(tag: string): tag is ValidTag {
  return VALID_TAGS.includes(tag as ValidTag)
}

function isValidPath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= PATH_MAX_LEN &&
    path.startsWith('/') &&
    PATH_RE.test(path)
  )
}

function secretMatches(provided: string | null, expected: string): boolean {
  if (provided === null) return false
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  // timingSafeEqual requires equal-length buffers — guard length first.
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(req: NextRequest): Promise<Response> {
  const secret = req.headers.get('x-revalidate-secret')
  if (!process.env.REVALIDATE_SECRET || !secretMatches(secret, process.env.REVALIDATE_SECRET)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as { tags?: unknown; paths?: unknown }
    const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string') : []
    const paths = Array.isArray(body.paths) ? body.paths.filter((p): p is string => typeof p === 'string') : []

    const invalidatedTags: string[] = []
    for (const tag of tags) {
      if (isValidTag(tag)) {
        revalidateTag(tag)
        invalidatedTags.push(tag)
      }
    }

    const invalidatedPaths: string[] = []
    for (const path of paths) {
      if (isValidPath(path)) {
        revalidatePath(path)
        invalidatedPaths.push(path)
      }
    }

    return Response.json({ revalidated: true, tags: invalidatedTags, paths: invalidatedPaths })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

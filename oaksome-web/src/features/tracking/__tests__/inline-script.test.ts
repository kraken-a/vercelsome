import { buildDataLayerPushScript } from '../inline-script'

describe('buildDataLayerPushScript', () => {
  it('keeps the view_collection event shape and values', () => {
    const script = buildDataLayerPushScript({
      event: 'view_collection',
      collection_name: 'Line',
      collection_slug: 'line',
    })
    expect(script).toContain(
      'window.dataLayer.push({"event":"view_collection","collection_name":"Line","collection_slug":"line"})'
    )
    expect(script).toContain("if(typeof window!=='undefined'&&window.dataLayer)")
  })

  it('neutralizes a hostile collection name (no tag break-out, no unescaped quotes)', () => {
    const hostile = `</script><img onerror=x>'"`
    const script = buildDataLayerPushScript({
      event: 'view_collection',
      collection_name: hostile,
      collection_slug: 'line',
    })
    expect(script).not.toContain('</script>')
    expect(script).not.toContain('<img')
    expect(script).not.toContain('<')
    // every double quote in the serialized value is JSON-escaped
    const json = script.match(/push\((.*)\)/)?.[1]
    expect(json).toBeDefined()
    // payload round-trips intact: same event shape, original value preserved
    expect(JSON.parse(json as string)).toEqual({
      event: 'view_collection',
      collection_name: hostile,
      collection_slug: 'line',
    })
  })
})

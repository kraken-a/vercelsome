/**
 * Builds the inline dataLayer push script for SSR-rendered tracking events.
 *
 * The payload object is serialized with `JSON.stringify`, which escapes `<`, `>`,
 * quotes and backslashes. This neutralizes hostile values (e.g. an Odoo-sourced
 * collection name containing `</script>`) so they cannot break out of the inline
 * `<script>` tag (stored XSS, audit finding C4).
 */
export function buildDataLayerPushScript(payload: Record<string, unknown>): string {
  // JSON.stringify escapes quotes/backslashes, but not `<`, `>` or `&`, so a value
  // like `</script>` would still break out of the inline tag. Escape those to their
  // `\uXXXX` form: the browser decodes them back to the original characters at parse
  // time, so the dataLayer payload round-trips intact while the markup stays inert.
  const json = JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
  return `if(typeof window!=='undefined'&&window.dataLayer){window.dataLayer.push(${json})}`
}

/**
 * Configurator postMessage protocol helpers (TASK-043).
 *
 * Security: every inbound postMessage action — including the `odooSession`
 * cookie handoff — must pass the origin allowlist BEFORE any side effect runs.
 * The `odoo_sid` value is additionally validated against a strict charset/length
 * pattern before it is written to `document.cookie`, because the proxy promotes
 * `odoo_sid -> session_id` (session-fixation vector, audit finding H1).
 */

export const ALLOWED_ORIGINS = [
    'https://oaksome.vercel.app',
    'https://oaksome-client.vercel.app',
    'https://oaks-indol.vercel.app',
    'https://api.tecnibo.com/pricing/*',
]

/** Odoo session id charset/length contract. */
const SESSION_ID_RE = /^[A-Za-z0-9_-]{10,128}$/

export function isAllowedOrigin(origin: string): boolean {
    return (
        ALLOWED_ORIGINS.includes(origin) ||
        origin === window.location.origin
    )
}

export function isValidSessionId(value: unknown): value is string {
    return typeof value === 'string' && SESSION_ID_RE.test(value)
}

/**
 * Build the loader overlay using DOM construction (no innerHTML).
 * The label is set via `textContent` so HTML in the label stays inert (L1).
 */
export function showOverlay(label: string): () => void {
    const overlay = document.createElement('div')
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '9998',
    })

    const notice = document.createElement('div')
    Object.assign(notice.style, {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        padding: '20px 30px', background: '#fff',
        borderRadius: '4px', zIndex: '9999',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    })

    const inner = document.createElement('div')
    Object.assign(inner.style, {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '14px', fontFamily: 'sans-serif',
    })

    const text = document.createElement('p')
    Object.assign(text.style, { margin: '0', color: '#333', fontSize: '1rem' })
    text.textContent = label

    inner.appendChild(text)
    notice.appendChild(inner)
    document.body.appendChild(overlay)
    document.body.appendChild(notice)
    return () => { overlay.remove(); notice.remove() }
}

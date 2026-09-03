/** @jest-environment jsdom */
import {
    isAllowedOrigin,
    isValidSessionId,
    showOverlay,
} from '../configurator-message'

/**
 * Reproduces the production handler order (TASK-043): origin gate first,
 * then action dispatch with session_id validation before the cookie write.
 */
function simulateMessage(event: { origin: string; data: Record<string, unknown> }): {
    cookieWritten: boolean
} {
    if (!isAllowedOrigin(event.origin)) return { cookieWritten: false }
    const action = event.data.action as string | undefined
    if (!action) return { cookieWritten: false }
    if (action === 'odooSession') {
        if (!isValidSessionId(event.data.session_id)) return { cookieWritten: false }
        document.cookie = `odoo_sid=${event.data.session_id}; path=/; SameSite=Lax`
        return { cookieWritten: true }
    }
    return { cookieWritten: false }
}

function clearCookies() {
    document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0].trim()
        if (name) document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    })
}

describe('Configurator postMessage hardening (TASK-043)', () => {
    beforeEach(() => {
        clearCookies()
        document.body.innerHTML = ''
    })

    it('rejects an odooSession message from a hostile origin (no cookie write)', () => {
        const res = simulateMessage({
            origin: 'https://evil.example.com',
            data: { action: 'odooSession', session_id: 'abcdef123456' },
        })
        expect(res.cookieWritten).toBe(false)
        expect(document.cookie).not.toMatch(/odoo_sid/)
    })

    it('writes the cookie for an allowlisted origin with a valid session_id', () => {
        const res = simulateMessage({
            origin: 'https://oaksome-client.vercel.app',
            data: { action: 'odooSession', session_id: 'Valid_Session-1234' },
        })
        expect(res.cookieWritten).toBe(true)
        expect(document.cookie).toContain('odoo_sid=Valid_Session-1234')
    })

    it('rejects a malformed session_id even from an allowlisted origin', () => {
        const tooShort = simulateMessage({
            origin: 'https://oaksome-client.vercel.app',
            data: { action: 'odooSession', session_id: 'short' },
        })
        expect(tooShort.cookieWritten).toBe(false)

        const badChars = simulateMessage({
            origin: 'https://oaksome-client.vercel.app',
            data: { action: 'odooSession', session_id: 'has spaces and ;=' },
        })
        expect(badChars.cookieWritten).toBe(false)

        const nonString = simulateMessage({
            origin: 'https://oaksome-client.vercel.app',
            data: { action: 'odooSession', session_id: 1234567890 },
        })
        expect(nonString.cookieWritten).toBe(false)
        expect(document.cookie).not.toMatch(/odoo_sid/)
    })

    it('isValidSessionId enforces charset/length', () => {
        expect(isValidSessionId('abcdef1234')).toBe(true)
        expect(isValidSessionId('a'.repeat(128))).toBe(true)
        expect(isValidSessionId('a'.repeat(129))).toBe(false)
        expect(isValidSessionId('short')).toBe(false)
        expect(isValidSessionId('bad chars!')).toBe(false)
        expect(isValidSessionId(undefined)).toBe(false)
    })

    it('renders the overlay label as inert text (HTML payload not parsed)', () => {
        const remove = showOverlay('<img src=x onerror="window.__pwned=1">')
        const p = document.body.querySelector('p')
        expect(p).not.toBeNull()
        // textContent keeps the raw string; no <img> element is created.
        expect(p?.textContent).toBe('<img src=x onerror="window.__pwned=1">')
        expect(document.body.querySelector('img')).toBeNull()
        remove()
        expect(document.body.querySelector('p')).toBeNull()
    })
})

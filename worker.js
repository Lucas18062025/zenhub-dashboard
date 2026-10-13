/**
 * zenhub-dashboard — Worker + Static Assets con security headers.
 * Inyecta headers en todas las respuestas (paridad con Portafolio).
 * CSP contempla: Google Fonts, cdnjs (html2pdf) y Open-Meteo (clima).
 */
const SEC_HEADERS = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    "X-Permitted-Cross-Domain-Policies": "none",
};
const CSP =
    "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://geocoding-api.open-meteo.com https://api.open-meteo.com; " +
    "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

async function secAssets(request, env) {
    const res = await env.ASSETS.fetch(request);
    const h = new Headers(res.headers);
    for (const [k, v] of Object.entries(SEC_HEADERS)) h.set(k, v);
    if ((h.get("Content-Type") || "").includes("text/html")) {
        h.set("Content-Security-Policy", CSP);
    }
    return new Response(res.body, { status: res.status, headers: h });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/google0cbe515c88088343.html") {
            return new Response(
                "google-site-verification: google0cbe515c88088343.html",
                {
                    headers: {
                        "Content-Type": "text/html; charset=utf-8",
                        ...SEC_HEADERS,
                        "Content-Security-Policy": CSP,
                    },
                }
            );
        }

        return secAssets(request, env);
    },
};

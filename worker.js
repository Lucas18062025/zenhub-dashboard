/**
 * zenhub-dashboard — Worker mínimo + Static Assets.
 * Solo existe para servir la verificación de Google Search Console
 * con URL exacta (200, sin redirect): Workers Static Assets redirige
 * /xxx.html → /xxx (clean URLs) con 307, y Google exige 200 exacto.
 * Todo lo demás pasa a los assets estáticos.
 */
export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/google0cbe515c88088343.html") {
            return new Response(
                "google-site-verification: google0cbe515c88088343.html",
                { headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
        }

        return env.ASSETS.fetch(request);
    },
};

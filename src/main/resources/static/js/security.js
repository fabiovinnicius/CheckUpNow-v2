(function () {
    const originalFetch = window.fetch.bind(window);
    let csrfRequest;

    async function csrfToken() {
        csrfRequest ??= originalFetch('/api/auth/csrf', {
            credentials: 'same-origin',
            cache: 'no-store'
        })
            .then(response => response.ok ? response.json() : Promise.reject(new Error('Falha ao iniciar sessão segura.')))
            .then(data => data.token)
            .finally(() => { csrfRequest = null; });
        return csrfRequest;
    }

    window.fetch = async function (input, init = {}) {
        const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
        const method = String(init.method || (typeof input !== 'string' && input.method) || 'GET').toUpperCase();
        if (url.origin === window.location.origin && !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
            const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
            headers.set('X-XSRF-TOKEN', await csrfToken());
            init = { ...init, headers, credentials: 'same-origin' };
        }
        return originalFetch(input, init);
    };
})();

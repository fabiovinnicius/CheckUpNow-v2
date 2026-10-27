export class ApiError extends Error {
    constructor(message, status = 0) {
        super(message);
        this.status = status;
    }
}

export async function api(url, options = {}) {
    let response;
    try {
        response = await fetch(url, options);
    } catch (_) {
        throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.');
    }
    if (response.status === 401) {
        localStorage.removeItem('checkupUser');
        window.location.href = 'login.html';
        throw new ApiError('Sua sessão terminou. Entre novamente.', 401);
    }
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await response.json().catch(() => ({})) : null;
    if (!response.ok) throw new ApiError(body?.message || 'Não foi possível concluir a operação.', response.status);
    return body;
}

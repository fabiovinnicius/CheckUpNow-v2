document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('admin-login-form');
    const password = document.getElementById('admin-login-password');
    const toggle = document.getElementById('toggle-password');
    const error = document.getElementById('admin-login-error');

    toggle?.addEventListener('change', () => {
        password.type = toggle.checked ? 'text' : 'password';
    });

    form?.addEventListener('submit', async event => {
        event.preventDefault();
        error.style.display = 'none';
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Entrando...';
        try {
            const response = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: document.getElementById('admin-login-email').value,
                    password: password.value
                })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || 'Não foi possível entrar.');
            window.location.href = 'admin-dashboard.html';
        } catch (requestError) {
            error.textContent = requestError.message;
            error.style.display = 'block';
        } finally {
            button.disabled = false;
            button.textContent = 'Entrar no painel';
        }
    });
});

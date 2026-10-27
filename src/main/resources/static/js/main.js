document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    async function getErrorMessage(response, fallback) {
        try {
            const body = await response.json();
            return body.message || fallback;
        } catch (_) {
            return fallback;
        }
    }

    function showFormMessage(form, message, type = 'error') {
        let region = form.querySelector('[data-form-message]');
        if (!region) {
            region = document.createElement('div');
            region.dataset.formMessage = '';
            region.setAttribute('role', 'status');
            region.style.cssText = 'margin:12px 0;padding:11px 13px;border-radius:8px;font-size:14px;line-height:1.35;';
            form.prepend(region);
        }
        region.textContent = message;
        region.style.color = type === 'success' ? '#176b43' : '#a12b2b';
        region.style.background = type === 'success' ? '#e8f7ef' : '#fdecec';
        region.style.border = `1px solid ${type === 'success' ? '#b9e4cc' : '#f2c4c4'}`;
        region.focus?.();
    }

    function setFormLoading(form, loading, label) {
        const button = form.querySelector('button[type="submit"]');
        if (!button) return;
        if (loading) {
            button.dataset.originalText = button.textContent;
            button.disabled = true;
            button.textContent = label;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }

    // ----------------------------------------------------
    // Auth & Forms Handling (Java REST Integration)
    // ----------------------------------------------------
    const registerForm = currentPage === 'index.html'
        ? document.querySelector('form[action="dashboard.html"]')
        : null;
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const inputs = registerForm.querySelectorAll('input');
            const name = inputs[0]?.value;
            const email = inputs[1]?.value;
            const password = document.getElementById('password')?.value;

            setFormLoading(registerForm, true, 'Criando conta...');
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                if (response.ok) {
                    const user = await response.json();
                    localStorage.setItem('checkupUser', JSON.stringify(user));
                    window.location.href = 'info-adicionais.html';
                } else {
                    showFormMessage(registerForm, await getErrorMessage(response, 'Erro ao registrar usuário.'));
                }
            } catch (err) {
                console.error('Falha ao registrar usuário:', err);
                showFormMessage(registerForm, 'Não foi possível conectar ao servidor. Tente novamente.');
            } finally {
                setFormLoading(registerForm, false);
            }
        });
    }

    const isLoginPage = currentPage === 'login.html';
    if (isLoginPage) {
        const loginFormEl = document.querySelector('form');
        if (loginFormEl) {
            loginFormEl.addEventListener('submit', async function(e) {
                e.preventDefault();
                const emailInput = loginFormEl.querySelector('input[type="email"]');
                const passwordInput = loginFormEl.querySelector('input[type="password"]');

                setFormLoading(loginFormEl, true, 'Entrando...');
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
                    });

                    if (response.ok) {
                        const user = await response.json();
                        localStorage.setItem('checkupUser', JSON.stringify(user));
                        window.location.href = user.role === 'ADMIN'
                            ? 'admin-dashboard.html'
                            : user.role === 'DOCTOR' ? 'doctor-dashboard.html' : 'dashboard.html';
                    } else {
                        showFormMessage(loginFormEl, await getErrorMessage(response, 'E-mail ou senha inválidos.'));
                    }
                } catch (err) {
                    console.error('Falha ao autenticar:', err);
                    showFormMessage(loginFormEl, 'Não foi possível conectar ao servidor. Tente novamente.');
                } finally {
                    setFormLoading(loginFormEl, false);
                }
            });
        }
    }

    const infoForm = document.querySelector('.info-form');
    if (infoForm) {
        infoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const storedUser = JSON.parse(localStorage.getItem('checkupUser') || '{}');
            const userId = storedUser.id;
            if (!userId) {
                window.location.href = 'login.html';
                return;
            }

            const birthDate = document.getElementById('nascimento')?.value;
            const cep = document.getElementById('cep')?.value;
            const cpf = document.getElementById('cpf')?.value;
            const phone = document.getElementById('contato')?.value;
            const genderSelect = infoForm.querySelector('select');
            const gender = genderSelect ? genderSelect.value : 'M';
            const healthPlanInput = infoForm.querySelector('input[placeholder*="Unimed"]');
            const healthPlan = healthPlanInput ? healthPlanInput.value : '';

            const checkboxes = infoForm.querySelectorAll('input[type="checkbox"]');
            const hasChronicDisease = checkboxes[0] ? checkboxes[0].checked : false;
            const takesContinuousMedication = checkboxes[1] ? checkboxes[1].checked : false;

            setFormLoading(infoForm, true, 'Salvando...');
            try {
                const response = await fetch(`/api/users/${userId}/additional-info`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        birthDate, cep, cpf, phone, gender, healthPlan,
                        hasChronicDisease, takesContinuousMedication
                    })
                });
                if (!response.ok) {
                    showFormMessage(infoForm, await getErrorMessage(response, 'Não foi possível salvar seus dados.'));
                    return;
                }
            } catch (err) {
                console.error('Falha ao atualizar dados:', err);
                showFormMessage(infoForm, 'Não foi possível conectar ao servidor. Tente novamente.');
                return;
            } finally {
                setFormLoading(infoForm, false);
            }
            window.location.href = 'sucesso.html';
        });
    }

    // ----------------------------------------------------
    // Password Toggle & Input Masks
    // ----------------------------------------------------
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('change', function() {
            const type = this.checked ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
        });
    }

    const nascimentoInput = document.getElementById('nascimento');
    if (nascimentoInput) {
        nascimentoInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '').substring(0, 8);
            let formatted = '';
            if (val.length > 0) formatted += val.substring(0, 2);
            if (val.length > 2) formatted += '/' + val.substring(2, 4);
            if (val.length > 4) formatted += '/' + val.substring(4, 8);
            e.target.value = formatted;
        });
    }

    const contatoInput = document.getElementById('contato');
    if (contatoInput) {
        contatoInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '').substring(0, 11);
            let formatted = '';
            if (val.length > 0) formatted = '(' + val.substring(0, 2);
            if (val.length > 2) {
                if (val.length === 11) {
                    formatted += ')-' + val.substring(2, 7) + '-' + val.substring(7, 11);
                } else {
                    let nextPart = val.substring(2, 6);
                    let lastPart = val.substring(6, 10);
                    formatted += ')-' + nextPart;
                    if (val.length > 6) formatted += '-' + lastPart;
                }
            }
            e.target.value = formatted;
        });
    }

    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '').substring(0, 8);
            let formatted = val;
            if (val.length > 5) formatted = val.substring(0, 5) + '-' + val.substring(5, 8);
            e.target.value = formatted;
        });
    }

    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '').substring(0, 11);
            let formatted = '';
            if (val.length > 0) formatted += val.substring(0, 3);
            if (val.length > 3) formatted += '.' + val.substring(3, 6);
            if (val.length > 6) formatted += '.' + val.substring(6, 9);
            if (val.length > 9) formatted += '-' + val.substring(9, 11);
            e.target.value = formatted;
        });
    }
});

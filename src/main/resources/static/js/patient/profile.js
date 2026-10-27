import { api } from './api.js';
import { setButtonLoading } from './ui.js';

export function initProfile({ notify, onUserUpdated }) {
    const container = document.querySelector('.profile-container');
    const inputs = [...document.querySelectorAll('#tab-perfil input, #tab-perfil select')];
    const button = document.getElementById('btn-save-profile');
    const avatarButton = document.getElementById('profile-avatar-btn');
    const upload = document.getElementById('profile-image-upload');
    const preview = document.getElementById('profile-image-preview');
    const icon = document.getElementById('profile-image-icon');
    let currentUser;
    let editing = false;
    let changed = false;

    function mask(id, formatter) {
        document.getElementById(id)?.addEventListener('input', event => {
            event.target.value = formatter(event.target.value.replace(/\D/g, ''));
        });
    }
    mask('nascimento-profile', value => [value.slice(0, 2), value.slice(2, 4), value.slice(4, 8)].filter(Boolean).join('/'));
    mask('cep-profile', value => value.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'));
    mask('cpf-profile', value => value.slice(0, 11)
        .replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2'));
    mask('contato-profile', value => {
        const digits = value.slice(0, 11);
        if (digits.length <= 2) return digits ? `(${digits}` : '';
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    });

    function setEditing(value) {
        editing = value;
        inputs.forEach(input => input.disabled = !editing);
        container.classList.toggle('profile-readonly', !editing);
        button.textContent = editing ? 'Salvar alterações' : 'Alterar informações';
    }

    function populate(user) {
        currentUser = user;
        const values = {
            'nome-profile': user.name, 'email-profile': user.email, 'nascimento-profile': user.birthDate,
            'cep-profile': user.cep, 'cpf-profile': user.cpf, 'contato-profile': user.phone,
            'sexo-profile': user.gender, 'convenio-profile': user.healthPlan
        };
        Object.entries(values).forEach(([id, value]) => document.getElementById(id).value = value ?? '');
        document.getElementById('doenca-cronica-profile').checked = user.hasChronicDisease === true;
        document.getElementById('medicamento-continuo-profile').checked = user.takesContinuousMedication === true;
        if (user.avatarUrl) {
            preview.src = user.avatarUrl;
            preview.style.display = 'block';
            icon.style.display = 'none';
        } else {
            preview.removeAttribute('src');
            preview.style.display = 'none';
            icon.style.display = '';
        }
        changed = false;
        setEditing(false);
    }

    inputs.forEach(input => ['input', 'change'].forEach(type => input.addEventListener(type, () => {
        if (editing) changed = true;
    })));
    avatarButton.addEventListener('click', () => editing && upload.click());
    upload.addEventListener('change', () => {
        if (!upload.files?.[0]) return;
        const reader = new FileReader();
        reader.onload = event => {
            preview.src = event.target.result;
            preview.style.display = 'block';
            icon.style.display = 'none';
            changed = true;
        };
        reader.readAsDataURL(upload.files[0]);
    });

    button.addEventListener('click', async () => {
        if (!editing) {
            setEditing(true);
            document.getElementById('nome-profile').focus();
            return;
        }
        if (!changed) {
            setEditing(false);
            return;
        }
        const name = document.getElementById('nome-profile').value.trim();
        const email = document.getElementById('email-profile').value.trim();
        if (!name || !email) {
            notify('Nome e e-mail são obrigatórios.', 'error');
            return;
        }
        setButtonLoading(button, true, 'Salvando...');
        let updated;
        try {
            updated = await api(`/api/users/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name, email,
                    birthDate: document.getElementById('nascimento-profile').value,
                    cep: document.getElementById('cep-profile').value,
                    cpf: document.getElementById('cpf-profile').value,
                    phone: document.getElementById('contato-profile').value,
                    gender: document.getElementById('sexo-profile').value,
                    healthPlan: document.getElementById('convenio-profile').value,
                    hasChronicDisease: document.getElementById('doenca-cronica-profile').checked,
                    takesContinuousMedication: document.getElementById('medicamento-continuo-profile').checked,
                    avatarUrl: preview.getAttribute('src') || ''
                })
            });
        } catch (error) {
            notify(error.message, 'error');
        } finally {
            setButtonLoading(button, false);
        }
        if (updated) {
            localStorage.setItem('checkupUser', JSON.stringify(updated));
            populate(updated);
            onUserUpdated(updated);
            notify('Informações do perfil atualizadas.');
        }
    });

    setEditing(false);
    return { populate };
}

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
                    alert(await getErrorMessage(response, 'Erro ao registrar usuário.'));
                }
            } catch (err) {
                console.error('Falha ao registrar usuário:', err);
                alert('Não foi possível conectar ao servidor. Tente novamente.');
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
                        alert(await getErrorMessage(response, 'E-mail ou senha inválidos.'));
                    }
                } catch (err) {
                    console.error('Falha ao autenticar:', err);
                    alert('Não foi possível conectar ao servidor. Tente novamente.');
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
                    alert(await getErrorMessage(response, 'Não foi possível salvar seus dados.'));
                    return;
                }
            } catch (err) {
                console.error('Falha ao atualizar dados:', err);
                alert('Não foi possível conectar ao servidor. Tente novamente.');
                return;
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

    // ----------------------------------------------------
    // Tab Navigation
    // ----------------------------------------------------
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (navBtns.length > 0 && tabContents.length > 0) {
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                navBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(tab => tab.classList.remove('active'));

                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                const targetTab = document.getElementById(targetId);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });
    }

    // ----------------------------------------------------
    // Doctors DB & Specialty Selection
    // ----------------------------------------------------
    const doctorsDB = {
        "Clínica Geral": ["Dr. Anderson teste", "Dra. Ana Mendes"],
        "Cardiologia": ["Dr. Roberto Costa", "Dr. Carlos Silva"],
        "Dermatologia": ["Dr. Raquel teste", "Dra. Marina Santos"],
        "Ginecologia": ["Dra. Camila Ribeiro", "Dra. Sofia Lima"],
        "Pediatria": ["Dra. Fernanda Gomes", "Dr. Lucas Martins"],
        "Ortopedia": ["Dr. Pedro Henrique", "Dr. André Santos"],
        "Psicologia": ["Dra. Júlia Nogueira", "Dr. Fernando Almeida"],
        "Nutrição": ["Dra. Beatriz Costa", "Dr. Gabriel Souza"],
        "Endocrinologia": ["Dr. Ricardo Alves", "Dra. Helena Martins"],
        "Neurologia": ["Dr. Antônio Carlos", "Dra. Letícia Ferreira"],
        "Oftalmologia": ["Dra. Lúcia Freitas", "Dr. Eduardo Ramos"],
        "Fisioterapia": ["Dra. Mariana Silva", "Dr. João Paulo"]
    };

    const timeSelect = document.getElementById('booking-time');
    const dateInput = document.getElementById('booking-date');
    const doctorSelect = document.getElementById('booking-doctor');
    let bookingWindowStart = '';
    let bookingWindowEnd = '';

    function localDateTimeValue(date) {
        const pad = value => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function applyLocalBookingWindowFallback() {
        const now = new Date();
        const start = new Date(now.getTime() + 60000);
        start.setSeconds(0, 0);
        const end = new Date(now);
        end.setFullYear(end.getFullYear() + 1);
        end.setSeconds(0, 0);
        bookingWindowStart = localDateTimeValue(start);
        bookingWindowEnd = localDateTimeValue(end);
    }

    function applyBookingDateLimits() {
        if (!dateInput || !bookingWindowStart || !bookingWindowEnd) return;
        dateInput.min = bookingWindowStart.slice(0, 10);
        dateInput.max = bookingWindowEnd.slice(0, 10);
    }

    async function populateAvailableTimes() {
        if (!timeSelect) return;
        timeSelect.innerHTML = '<option value="" disabled selected>Selecione o horário</option>';
        if (!dateInput?.value || !doctorSelect?.value || !bookingWindowStart || !bookingWindowEnd) return;
        timeSelect.innerHTML = '<option value="" disabled selected>Carregando horários...</option>';
        try {
            const response = await fetch(`/api/doctors/${doctorSelect.value}/available-times?date=${dateInput.value}`);
            if (!response.ok) throw new Error();
            const times = await response.json();
            timeSelect.innerHTML = '<option value="" disabled selected>Selecione o horário</option>';
            times.forEach(hour => timeSelect.insertAdjacentHTML('beforeend', `<option value="${hour}">${hour}</option>`));
            if (!times.length) timeSelect.innerHTML = '<option value="" disabled selected>Nenhum horário disponível nesta data</option>';
        } catch (error) {
            timeSelect.innerHTML = '<option value="" disabled selected>Nenhum horário disponível nesta data</option>';
        }
    }

    async function loadBookingWindow() {
        applyLocalBookingWindowFallback();
        try {
            const response = await fetch('/api/appointments/window');
            if (response.ok) {
                const windowData = await response.json();
                bookingWindowStart = windowData.startDateTime;
                bookingWindowEnd = windowData.endDateTime;
            }
        } catch (error) {
            console.warn('Usando horário local para a janela de agendamento.', error);
        }
        applyBookingDateLimits();
        populateAvailableTimes();
    }

    dateInput?.addEventListener('change', populateAvailableTimes);
    doctorSelect?.addEventListener('change', populateAvailableTimes);
    if (dateInput && timeSelect) loadBookingWindow();

    const agendaHeader = document.getElementById('agenda-header');
    const specialtiesSection = document.getElementById('specialties-section');
    const bookingSection = document.getElementById('booking-section');
    const bookingTitle = document.getElementById('booking-title');
    const btnBackAgenda = document.getElementById('btn-back-agenda');

    if (specialtiesSection && bookingSection) {
        specialtiesSection.addEventListener('click', async event => {
            const btn = event.target.closest('.specialty-btn');
            if (!btn) return;
                await loadBookingWindow();
                const specialtyName = btn.textContent.trim();
                bookingTitle.textContent = `Agendando: ${specialtyName}`;
                doctorSelect.innerHTML = '<option value="" disabled selected>Selecione o médico</option>';

                try {
                    const resp = await fetch(`/api/doctors/specialty?name=${encodeURIComponent(specialtyName)}`);
                    if (resp.ok) {
                        const doctors = await resp.json();
                        if (doctors.length > 0) {
                            doctors.forEach(doc => {
                                let option = document.createElement('option');
                                option.value = doc.id;
                                option.dataset.name = doc.name;
                                option.textContent = doc.name;
                                doctorSelect.appendChild(option);
                            });
                        }
                    }
                } catch (e) {
                    doctorSelect.innerHTML = '<option value="" disabled selected>Não foi possível carregar médicos</option>';
                }

                agendaHeader.style.display = 'none';
                specialtiesSection.style.display = 'none';
                bookingSection.style.display = 'flex';
        });

        fetch('/api/specialties')
            .then(response => response.ok ? response.json() : Promise.reject())
            .then(specialties => {
                specialtiesSection.innerHTML = specialties.length
                    ? specialties.map(item => `<button class="specialty-btn">${escapeHtml(item.name)}</button>`).join('')
                    : '<p class="specialties-loading">Nenhum tipo de consulta disponível no momento.</p>';
            })
            .catch(() => {
                specialtiesSection.innerHTML = Object.keys(doctorsDB)
                    .map(name => `<button class="specialty-btn">${escapeHtml(name)}</button>`).join('');
            });
    }

    if (btnBackAgenda) {
        btnBackAgenda.addEventListener('click', () => {
            bookingSection.style.display = 'none';
            agendaHeader.style.display = 'block';
            specialtiesSection.style.display = 'grid';
        });
    }

    // ----------------------------------------------------
    // Patient history (authenticated user + PostgreSQL data)
    // ----------------------------------------------------
    const historyListElement = document.getElementById('history-list');
    const historyPatientName = document.getElementById('history-patient-name');

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function appointmentStatus(status) {
        if (status === 'CANCELADO') return { cssClass: 'cancelled', label: 'Cancelada' };
        if (status === 'CONCLUIDO') return { cssClass: 'done', label: 'Concluída' };
        return { cssClass: 'ongoing', label: 'Agendada' };
    }

    function showEmptyHistory() {
        if (!historyListElement) return;
        historyListElement.innerHTML = '<div class="history-empty" id="history-empty">Você ainda não possui consultas agendadas.</div>';
    }

    function createAppointmentCard(appointment) {
        const status = appointmentStatus(appointment.status);
        const card = document.createElement('div');
        card.className = 'history-card';
        card.dataset.appointmentId = appointment.id;
        card.setAttribute('data-search', `${appointment.doctorName ?? ''} ${appointment.specialty ?? ''}`.toLowerCase());
        card.innerHTML = `
            <div class="history-card-top-right">${escapeHtml(appointment.appointmentDate)}</div>
            <div class="history-row">
                <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <strong>${escapeHtml(appointment.specialty)}</strong>
            </div>
            <div class="history-row">
                <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>Unidade Central – Sala a definir</span>
            </div>
            <div class="history-row">
                <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>${escapeHtml(appointment.doctorName)}</span>
            </div>
            <div class="history-row space-between">
                <div class="h-col">
                    <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>${escapeHtml(appointment.appointmentDate)} às ${escapeHtml(appointment.appointmentTime)}</span>
                </div>
                <div class="h-actions">
                    <span class="status-pill ${status.cssClass}"><span class="dot"></span> ${status.label}</span>
                    ${appointment.status === 'AGENDADO' ? '<button class="btn-cancel-appt" title="Cancelar Consulta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>' : ''}
                </div>
            </div>
            ${appointment.status === 'CONCLUIDO' ? `<div class="medical-documents" data-patient-documents="${appointment.id}"><span class="documents-loading">Buscando documentos médicos...</span></div>` : ''}
        `;

        const cancelButton = card.querySelector('.btn-cancel-appt');
        if (cancelButton) {
            cancelButton.addEventListener('click', async () => {
                if (!confirm('Tem certeza que deseja cancelar esta consulta?')) return;
                const response = await fetch(`/api/appointments/${appointment.id}/cancel`, { method: 'PUT' });
                if (!response.ok) {
                    alert(await getErrorMessage(response, 'Não foi possível cancelar a consulta.'));
                    return;
                }
                const updatedAppointment = await response.json();
                card.replaceWith(createAppointmentCard(updatedAppointment));
                historyCards = document.querySelectorAll('.history-card');
            });
        }

        return card;
    }

    async function loadPatientDocuments(container) {
        const appointmentId = container.dataset.patientDocuments;
        try {
            const response = await fetch(`/api/medical-documents/appointments/${appointmentId}`);
            if (!response.ok) throw new Error('Não foi possível carregar os documentos.');
            const documents = await response.json();
            container.innerHTML = documents.length ? `
                <strong class="documents-title">Documentos médicos</strong>
                <div class="document-links">${documents.map(document => `
                    <a class="medical-document-link" href="${document.downloadUrl}" target="_blank" rel="noopener">
                        <span>${escapeHtml(({ATESTADO:'Atestado',RECEITA:'Receita',EXAME:'Exame',OUTRO:'Documento'})[document.type] || document.type)}</span>
                        <strong>${escapeHtml(document.title)}</strong>
                    </a>`).join('')}</div>` : '';
        } catch (error) {
            container.innerHTML = '<span class="documents-error">Não foi possível carregar os documentos.</span>';
        }
    }

    function renderHistory(appointments) {
        if (!historyListElement) return;
        historyListElement.innerHTML = '';
        if (!appointments.length) {
            showEmptyHistory();
            return;
        }
        appointments.forEach(appointment => historyListElement.appendChild(createAppointmentCard(appointment)));
        historyListElement.querySelectorAll('[data-patient-documents]').forEach(loadPatientDocuments);
    }

    async function loadPatientDashboard() {
        if (!historyListElement) return;
        try {
            const [userResponse, appointmentsResponse] = await Promise.all([
                fetch('/api/auth/me'),
                fetch('/api/appointments')
            ]);

            if (userResponse.status === 401 || appointmentsResponse.status === 401) {
                localStorage.removeItem('checkupUser');
                window.location.href = 'login.html';
                return;
            }
            if (!userResponse.ok || !appointmentsResponse.ok) {
                throw new Error('Não foi possível carregar o painel.');
            }

            const user = await userResponse.json();
            const appointments = await appointmentsResponse.json();
            localStorage.setItem('checkupUser', JSON.stringify(user));
            if (historyPatientName) historyPatientName.textContent = user.name;
            populatePatientProfile(user);
            renderHistory(appointments);
            historyCards = document.querySelectorAll('.history-card');
        } catch (error) {
            console.error('Falha ao carregar histórico:', error);
            if (historyPatientName) historyPatientName.textContent = 'Paciente';
            showEmptyHistory();
        }
    }

    // ----------------------------------------------------
    // History Search
    // ----------------------------------------------------
    let historyCards = document.querySelectorAll('.history-card');
    const searchDoctorInput = document.getElementById('search-doctor');

    if (searchDoctorInput) {
        searchDoctorInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            historyCards = document.querySelectorAll('.history-card');

            historyCards.forEach(card => {
                const searchText = card.getAttribute('data-search') ? card.getAttribute('data-search').toLowerCase() : card.textContent.toLowerCase();
                if (searchText.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    if (currentPage === 'dashboard.html') loadPatientDashboard();

    // Profile Masks
    const nascProfile = document.getElementById('nascimento-profile');
    if (nascProfile) {
        nascProfile.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '').substring(0, 8);
            let formatted = '';
            if (val.length > 4) formatted = val.substring(0,2) + '/' + val.substring(2,4) + '/' + val.substring(4,8);
            else if (val.length > 2) formatted = val.substring(0,2) + '/' + val.substring(2,4);
            else formatted = val;
            e.target.value = formatted;
        });
    }

    const cepProfile = document.getElementById('cep-profile');
    if (cepProfile) {
        cepProfile.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '').substring(0, 8);
            if (val.length > 5) val = val.substring(0,5) + '-' + val.substring(5,8);
            e.target.value = val;
        });
    }

    const cpfProfile = document.getElementById('cpf-profile');
    if (cpfProfile) {
        cpfProfile.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '').substring(0, 11);
            let formatted = '';
            if (val.length > 9) formatted = val.substring(0,3) + '.' + val.substring(3,6) + '.' + val.substring(6,9) + '-' + val.substring(9,11);
            else if (val.length > 6) formatted = val.substring(0,3) + '.' + val.substring(3,6) + '.' + val.substring(6,9);
            else if (val.length > 3) formatted = val.substring(0,3) + '.' + val.substring(3,6);
            else formatted = val;
            e.target.value = formatted;
        });
    }

    const contatoProfile = document.getElementById('contato-profile');
    if (contatoProfile) {
        contatoProfile.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '').substring(0, 11);
            let formatted = '';
            if (val.length > 6) formatted = '(' + val.substring(0,2) + ') ' + val.substring(2,7) + '-' + val.substring(7,11);
            else if (val.length > 2) formatted = '(' + val.substring(0,2) + ') ' + val.substring(2,7);
            else if (val.length > 0) formatted = '(' + val;
            e.target.value = formatted;
        });
    }

    let hasUnsavedChanges = false;
    let isProfileEditing = false;
    const profileContainer = document.querySelector('.profile-container');
    const profileInputs = document.querySelectorAll('#tab-perfil input, #tab-perfil select');
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const avatarBtn = document.getElementById('profile-avatar-btn');
    const imageUpload = document.getElementById('profile-image-upload');
    const imagePreview = document.getElementById('profile-image-preview');
    const imageIcon = document.getElementById('profile-image-icon');

    function setProfileEditing(editing) {
        isProfileEditing = editing;
        profileInputs.forEach(input => input.disabled = !editing);
        profileContainer?.classList.toggle('profile-readonly', !editing);
        if (btnSaveProfile) btnSaveProfile.textContent = editing ? 'Salvar alterações' : 'Alterar informações';
    }

    function populatePatientProfile(user) {
        const values = {
            'nome-profile': user.name,
            'email-profile': user.email,
            'nascimento-profile': user.birthDate,
            'cep-profile': user.cep,
            'cpf-profile': user.cpf,
            'contato-profile': user.phone,
            'sexo-profile': user.gender,
            'convenio-profile': user.healthPlan
        };

        Object.entries(values).forEach(([id, value]) => {
            const field = document.getElementById(id);
            if (field) field.value = value ?? '';
        });

        const chronicDisease = document.getElementById('doenca-cronica-profile');
        const continuousMedication = document.getElementById('medicamento-continuo-profile');
        if (chronicDisease) chronicDisease.checked = user.hasChronicDisease === true;
        if (continuousMedication) continuousMedication.checked = user.takesContinuousMedication === true;

        if (imagePreview && imageIcon) {
            if (user.avatarUrl) {
                imagePreview.src = user.avatarUrl;
                imagePreview.style.display = 'block';
                imageIcon.style.display = 'none';
            } else {
                imagePreview.removeAttribute('src');
                imagePreview.style.display = 'none';
                imageIcon.style.display = 'block';
            }
        }

        hasUnsavedChanges = false;
        setProfileEditing(false);
    }

    profileInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (isProfileEditing) hasUnsavedChanges = true;
        });
        input.addEventListener('change', () => {
            if (isProfileEditing) hasUnsavedChanges = true;
        });
    });

    setProfileEditing(false);

    if (avatarBtn && imageUpload) {
        avatarBtn.addEventListener('click', () => {
            if (isProfileEditing) imageUpload.click();
        });

        imageUpload.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                    imageIcon.style.display = 'none';
                    hasUnsavedChanges = true;
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // ----------------------------------------------------
    // Confirm Appointment Booking (API + UI update)
    // ----------------------------------------------------
    const btnConfirmBooking = document.getElementById('btn-confirm-booking');
    if (btnConfirmBooking) {
        btnConfirmBooking.addEventListener('click', async () => {
            const docSelect = document.getElementById('booking-doctor');
            const dateInput = document.getElementById('booking-date');
            const timeSelect = document.getElementById('booking-time');

            if (!docSelect.value || !dateInput.value || !timeSelect.value) {
                alert("Por favor, preencha todos os campos (data, horário e médico) antes de confirmar.");
                return;
            }

            const selectedDateTime = `${dateInput.value}T${timeSelect.value}`;
            if (selectedDateTime < bookingWindowStart || selectedDateTime > bookingWindowEnd) {
                alert('A consulta deve estar entre o momento atual e até um ano no futuro. Escolha outra data ou horário.');
                await loadBookingWindow();
                return;
            }

            const specialty = document.getElementById('booking-title').textContent.replace('Agendando: ', '');
            const doctorId = Number(docSelect.value);
            const doctor = docSelect.options[docSelect.selectedIndex].dataset.name;
            const timeText = timeSelect.options[timeSelect.selectedIndex].text;

            let savedAppointment;
            try {
                const response = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        doctorId: doctorId,
                        doctorName: doctor,
                        specialty: specialty,
                        appointmentDate: dateInput.value,
                        appointmentTime: timeText
                    })
                });
                if (!response.ok) {
                    alert(await getErrorMessage(response, 'Não foi possível realizar o agendamento.'));
                    if (response.status === 401) window.location.href = 'login.html';
                    return;
                }
                savedAppointment = await response.json();
            } catch (err) {
                console.error('Falha ao realizar agendamento:', err);
                alert('Não foi possível conectar ao servidor. Tente novamente.');
                return;
            }

            const newCard = createAppointmentCard(savedAppointment);
            document.getElementById('history-empty')?.remove();
            historyListElement?.prepend(newCard);

            historyCards = document.querySelectorAll('.history-card');
            alert('Agendamento confirmado com sucesso! Você pode visualizar sua consulta na aba de Histórico.');

            document.getElementById('booking-section').style.display = 'none';
            document.getElementById('agenda-header').style.display = 'block';
            document.getElementById('specialties-section').style.display = 'grid';

            docSelect.value = '';
            dateInput.value = '';
            populateAvailableTimes();
        });
    }

    // ----------------------------------------------------
    // Save Profile (API + UI update)
    // ----------------------------------------------------
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', async () => {
            if (!isProfileEditing) {
                setProfileEditing(true);
                document.getElementById('nome-profile')?.focus();
                return;
            }

            if (!hasUnsavedChanges) {
                setProfileEditing(false);
                return;
            }

            const storedUser = JSON.parse(localStorage.getItem('checkupUser') || '{}');
            const userId = storedUser.id;
            if (!userId) {
                window.location.href = 'login.html';
                return;
            }

            const nameInput = document.getElementById('nome-profile');
            const emailInput = document.getElementById('email-profile');
            const birthInput = document.getElementById('nascimento-profile');
            const cepInputProf = document.getElementById('cep-profile');
            const cpfInputProf = document.getElementById('cpf-profile');
            const phoneInputProf = document.getElementById('contato-profile');
            const genderInput = document.getElementById('sexo-profile');
            const healthPlanInput = document.getElementById('convenio-profile');
            const chronicDiseaseInput = document.getElementById('doenca-cronica-profile');
            const continuousMedicationInput = document.getElementById('medicamento-continuo-profile');

            if (!nameInput?.value.trim() || !emailInput?.value.trim()) {
                alert('Nome e e-mail são obrigatórios.');
                return;
            }

            try {
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: nameInput ? nameInput.value : undefined,
                        email: emailInput ? emailInput.value : undefined,
                        birthDate: birthInput ? birthInput.value : undefined,
                        cep: cepInputProf ? cepInputProf.value : undefined,
                        cpf: cpfInputProf ? cpfInputProf.value : undefined,
                        phone: phoneInputProf ? phoneInputProf.value : undefined,
                        gender: genderInput ? genderInput.value : undefined,
                        healthPlan: healthPlanInput ? healthPlanInput.value : undefined,
                        hasChronicDisease: chronicDiseaseInput ? chronicDiseaseInput.checked : false,
                        takesContinuousMedication: continuousMedicationInput ? continuousMedicationInput.checked : false,
                        avatarUrl: imagePreview?.getAttribute('src') || ''
                    })
                });
                if (!response.ok) {
                    alert(await getErrorMessage(response, 'Não foi possível atualizar o perfil.'));
                    return;
                }
                const updatedUser = await response.json();
                localStorage.setItem('checkupUser', JSON.stringify(updatedUser));
                if (historyPatientName) historyPatientName.textContent = updatedUser.name;
                populatePatientProfile(updatedUser);
            } catch (err) {
                console.error('Falha ao atualizar perfil:', err);
                alert('Não foi possível conectar ao servidor. Tente novamente.');
                return;
            }

            btnSaveProfile.textContent = 'Informações atualizadas!';
            btnSaveProfile.style.backgroundColor = '#1D6B35';

            setTimeout(() => {
                btnSaveProfile.textContent = 'Alterar informações';
                btnSaveProfile.style.backgroundColor = '';
            }, 3000);
        });
    }
    // Admin Reception Actions
    const btnConfirmPresence = document.querySelectorAll('.btn-confirm-presence');
    const btnNoShow = document.querySelectorAll('.btn-no-show');
    btnConfirmPresence.forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.history-card');
            const pill = card.querySelector('.status-pill');
            pill.className = 'status-pill'
            pill.style.background = '#E6F4EA';
            pill.style.color = '#1D6B35';
            pill.innerHTML = '<span class="dot" style="background:#1D6B35"></span> Em consulta';
            this.style.display = 'none';
            const noShowBtn = card.querySelector('.btn-no-show');
            if(noShowBtn) noShowBtn.style.display = 'none';
        });
    });
    btnNoShow.forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.history-card');
            const pill = card.querySelector('.status-pill');
            pill.className = 'status-pill cancelled';
            pill.innerHTML = '<span class="dot"></span> Faltou';
            this.style.display = 'none';
            const confirmBtn = card.querySelector('.btn-confirm-presence');
            if(confirmBtn) confirmBtn.style.display = 'none';
        });
    });
    const searchPatientInput = document.getElementById('search-patient-input');
    if (searchPatientInput) {
        searchPatientInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const patientCards = document.querySelectorAll('#tab-pacientes .history-list .history-card');
            patientCards.forEach(card => {
                const name = card.querySelector('strong').textContent.toLowerCase();
                if (name.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    const agendaConfigMain = document.getElementById('agenda-config-main');
    const agendaConfigTimes = document.getElementById('agenda-config-times');
    const configSpecTitle = document.getElementById('config-specialty-title');
    const btnBackAgendaConfig = document.getElementById('btn-back-agenda-config');
    const configSpecBtns = document.querySelectorAll('.config-spec-btn');
    if (agendaConfigMain && agendaConfigTimes && configSpecBtns) {
        configSpecBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const specialtyName = this.textContent;
                if (configSpecTitle) configSpecTitle.textContent = specialtyName;
                agendaConfigMain.style.display = 'none';
                agendaConfigTimes.style.display = 'flex';
            });
        });
    }
    if (btnBackAgendaConfig) {
        btnBackAgendaConfig.addEventListener('click', function() {
            agendaConfigTimes.style.display = 'none';
            agendaConfigMain.style.display = 'flex';
        });
    }
    const agendaDateBtns = document.querySelectorAll('#tab-agenda-config .date-btn');
    const agendaTimesList = document.getElementById('agenda-times-list');
    function generateAgendaTimes(dayName) {
        if (!agendaTimesList) return;
        agendaTimesList.innerHTML = '';
        let startHour = 9;
        let endHour = 23;
        const ocupados = {};
        if (dayName === 'Hoje') {
            ocupados['10:30'] = 'Maria Clara Santos';
            ocupados['14:00'] = 'João Pedro Lima';
            ocupados['15:30'] = 'Ana Beatriz Costa';
        } else if (dayName === 'Seg') {
            ocupados['09:00'] = 'Carlos Eduardo Rocha';
            ocupados['11:30'] = 'Fernanda Gomes';
        } else if (dayName === 'Qua') {
            ocupados['18:00'] = 'Ricardo Silva';
        }
        for(let h = startHour; h <= endHour; h++) {
            ['00', '30'].forEach(m => {
                if (h === 23 && m === '30') return;
                let hourStr = h.toString().padStart(2, '0');
                let time = `${hourStr}:${m}`;
                let isOccupied = !!ocupados[time];
                let patientName = ocupados[time] || '';
                let labelStyle = isOccupied ? 'color: #999;' : 'color: #111;';
                let patientHtml = isOccupied ? `<span style="font-size: 11px; color: #E53935; background: #FFEBEE; padding: 2px 6px; border-radius: 4px; font-weight: 700; display: inline-block; margin-top: 4px;">Ocupado por ${patientName}</span>` : '';
                let disabledAttr = isOccupied ? 'disabled' : 'checked';
                let opacityStyle = isOccupied ? 'opacity: 0.8;' : '';
                let cardHtml = `
                    <div class="history-card" style="flex-direction: row; justify-content: space-between; align-items: center; padding: 12px 16px; ${opacityStyle}">
                        <div style="display: flex; flex-direction: column;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="${isOccupied ? '#999' : '#666'}" stroke-width="2" style="width: 18px; height: 18px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                <strong style="font-size: 15px; ${labelStyle}">${time}</strong>
                            </div>
                            ${patientHtml}
                        </div>
                        <div style="display: flex; align-items: center;">
                            <label class="switch">
                                <input type="checkbox" ${disabledAttr}>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                `;
                agendaTimesList.insertAdjacentHTML('beforeend', cardHtml);
            });
        }
    }
    if (agendaDateBtns) {
        agendaDateBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                agendaDateBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const dayName = this.querySelector('.day-name').textContent;
                generateAgendaTimes(dayName);
            });
        });
        if (agendaDateBtns.length > 0) {
            generateAgendaTimes('Hoje');
        }
    }
    const perfilAdminMain = document.getElementById('perfil-admin-main');
    const perfilAdminInfo = document.getElementById('perfil-admin-info');
    const perfilAdminSenha = document.getElementById('perfil-admin-senha');
    const perfilAdminEquipe = document.getElementById('perfil-admin-equipe');
    const perfilAdminAddEquipe = document.getElementById('perfil-admin-add-equipe');
    const btnPerfilInfo = document.getElementById('btn-perfil-info');
    const btnPerfilSenha = document.getElementById('btn-perfil-senha');
    const btnPerfilEquipe = document.getElementById('btn-perfil-equipe');
    const btnsBackPerfil = document.querySelectorAll('.btn-back-perfil');
    function hideAllPerfilScreens() {
        if (perfilAdminMain) perfilAdminMain.style.display = 'none';
        if (perfilAdminInfo) perfilAdminInfo.style.display = 'none';
        if (perfilAdminSenha) perfilAdminSenha.style.display = 'none';
        if (perfilAdminEquipe) perfilAdminEquipe.style.display = 'none';
        if (perfilAdminAddEquipe) perfilAdminAddEquipe.style.display = 'none';
    }
    if (btnPerfilInfo) {
        btnPerfilInfo.addEventListener('click', () => {
            hideAllPerfilScreens();
            perfilAdminInfo.style.display = 'flex';
        });
    }
    if (btnPerfilSenha) {
        btnPerfilSenha.addEventListener('click', () => {
            hideAllPerfilScreens();
            perfilAdminSenha.style.display = 'flex';
        });
    }
    if (btnPerfilEquipe) {
        btnPerfilEquipe.addEventListener('click', () => {
            hideAllPerfilScreens();
            perfilAdminEquipe.style.display = 'flex';
            renderTeam();
        });
    }
    if (btnsBackPerfil && btnsBackPerfil.length > 0) {
        btnsBackPerfil.forEach(btn => {
            btn.addEventListener('click', () => {
                if (perfilAdminAddEquipe && perfilAdminAddEquipe.style.display === 'flex') {
                    hideAllPerfilScreens();
                    perfilAdminEquipe.style.display = 'flex';
                    renderTeam();
                } else {
                    hideAllPerfilScreens();
                    if (perfilAdminMain) perfilAdminMain.style.display = 'flex';
                }
            });
        });
    }
    let teamMembers = [
        { id: 1, name: 'Renata Souza', role: 'Administradora', isYou: true, isAdmin: true },
        { id: 2, name: 'Dr. Carlos Mendes', role: 'Médico', isYou: false, isAdmin: false },
        { id: 3, name: 'Dra. Ana Paula', role: 'Médica', isYou: false, isAdmin: false },
        { id: 4, name: 'Marcos Ferreira', role: 'Recepcionista', isYou: false, isAdmin: false },
        { id: 5, name: 'Laura Campos', role: 'Recepcionista', isYou: false, isAdmin: false }
    ];
    const teamListContainer = document.getElementById('team-members-list');
    const btnAddMember = document.getElementById('btn-add-member');
    const btnSaveMember = document.getElementById('btn-save-member');
    const inputMemberName = document.getElementById('new-member-name');
    const inputMemberRole = document.getElementById('new-member-role');
    window.removeTeamMember = function(id) {
        if (confirm('Tem certeza que deseja remover este usuário?')) {
            teamMembers = teamMembers.filter(m => m.id !== id);
            renderTeam();
        }
    };
    function getInitials(name) {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    function renderTeam() {
        if (!teamListContainer) return;
        teamListContainer.innerHTML = '';
        teamMembers.forEach(member => {
            const initials = getInitials(member.name);
            const badgeAdmin = member.isAdmin ? `<span style="background-color: #D4F4DF; color: #1D6B35; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 8px; margin-right: 8px;">admin</span>` : '';
            const badgeYou = member.isYou ? `<span style="background-color: #E6F0FF; color: #0056D2; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 8px;">Você</span>` : '';
            const btnRemove = !member.isYou ? `
                <button aria-label="Remover" style="background: none; border: none; cursor: pointer; padding: 4px;" onclick="window.removeTeamMember(${member.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#E53935" stroke-width="2" style="width: 18px; height: 18px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            ` : '';
            const bgColor = member.isYou ? '#0056D2' : '#EEE';
            const color = member.isYou ? 'white' : '#333';
            teamListContainer.innerHTML += `
                <div class="history-card" style="align-items: center; justify-content: space-between; flex-direction: row; padding: 16px; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center;">
                        <div class="avatar-initials" style="background: ${bgColor}; color: ${color}; width: 40px; height: 40px; font-size: 14px;">${initials}</div>
                        <div>
                            <strong style="font-size: 15px; color: #111;">${member.name}</strong>
                            <p style="font-size: 13px; color: #666; margin-top: 2px; display: flex; align-items: center;">
                                ${badgeAdmin}
                                ${member.role}
                            </p>
                        </div>
                    </div>
                    ${member.isYou ? badgeYou : btnRemove}
                </div>
            `;
        });
    }
    if (btnAddMember) {
        btnAddMember.addEventListener('click', () => {
            hideAllPerfilScreens();
            inputMemberName.value = '';
            inputMemberRole.value = 'Recepcionista';
            perfilAdminAddEquipe.style.display = 'flex';
        });
    }
    if (btnSaveMember) {
        btnSaveMember.addEventListener('click', () => {
            const name = inputMemberName.value.trim();
            const role = inputMemberRole.value;
            if (!name) {
                alert('Por favor, informe o nome do membro.');
                return;
            }
            const newId = teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.id)) + 1 : 1;
            const isAdmin = role.includes('Administrador');
            teamMembers.push({
                id: newId,
                name: name,
                role: role,
                isYou: false,
                isAdmin: isAdmin
            });
            hideAllPerfilScreens();
            perfilAdminEquipe.style.display = 'flex';
            renderTeam();
        });
    }

    // ----------------------------------------------------
    // DOCTOR PORTAL & DASHBOARD LOGIC
    // ----------------------------------------------------
    const doctorLoginForm = document.getElementById('doctor-login-form');
    if (doctorLoginForm) {
        doctorLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const doctorEmail = document.getElementById('doctor-email')?.value || 'roberto.costa@checkupnow.com';
            localStorage.setItem('checkupDoctor', JSON.stringify({
                name: 'Dr. Roberto Costa',
                crm: '12345/SP',
                specialty: 'Cardiologia',
                email: doctorEmail
            }));
            window.location.href = 'doctor-dashboard.html';
        });
    }

    // Doctor Queue Filters
    const doctorFilterChips = document.querySelectorAll('.doctor-filter-tabs .filter-chip');
    const doctorPatientCards = document.querySelectorAll('.doctor-patient-card');
    if (doctorFilterChips.length > 0) {
        doctorFilterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                doctorFilterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const filter = chip.getAttribute('data-filter');

                doctorPatientCards.forEach(card => {
                    const status = card.getAttribute('data-status');
                    if (filter === 'all') {
                        card.style.display = 'flex';
                    } else if (filter === 'waiting' && (status === 'waiting' || status === 'ongoing')) {
                        card.style.display = 'flex';
                    } else if (filter === 'done' && status === 'done') {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // Patient Call Action
    document.querySelectorAll('.btn-call-patient').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.doctor-patient-card');
            const patientName = card.querySelector('.doc-patient-name')?.textContent || 'Paciente';
            const statusPill = card.querySelector('.pill-patient-status');

            if (statusPill) {
                statusPill.className = 'status-pill ongoing';
                statusPill.style.background = '#FFF3CD';
                statusPill.style.color = '#856404';
                statusPill.innerHTML = '<span class="dot" style="background: #856404;"></span> Chamado no Painel';
            }
            alert(`Sinal emitido: Paciente ${patientName} foi chamado no painel da recepção!`);
        });
    });

    // Start / Continue Consultation
    const patientsMock = {
        '1': { name: 'Maria Clara Silva', age: '34 anos', gender: 'Feminino', cpf: '123.456.789-00', plan: 'Unimed', chronic: 'Hipertensão Arterial', meds: 'Losartana 50mg', allergies: 'Nenhuma relatada', avatarBg: '#0056D2', initials: 'MC' },
        '2': { name: 'João Pedro Lima', age: '45 anos', gender: 'Masculino', cpf: '987.654.321-11', plan: 'Bradesco Saúde', chronic: 'Nenhuma', meds: 'Nenhum', allergies: 'Alergia a Penicilina', avatarBg: '#1D6B35', initials: 'JP' },
        '3': { name: 'Ana Beatriz Costa', age: '29 anos', gender: 'Feminino', cpf: '456.789.123-22', plan: 'Particular', chronic: 'Asma', meds: 'Salbutamol aerossol', allergies: 'Dipirona', avatarBg: '#666', initials: 'AB' },
        '4': { name: 'Carlos Eduardo Rocha', age: '52 anos', gender: 'Masculino', cpf: '321.654.987-33', plan: 'SulAmérica', chronic: 'Diabetes Tipo 2', meds: 'Metformina 850mg', allergies: 'Nenhuma relatada', avatarBg: '#0056D2', initials: 'CE' }
    };

    let currentConsultationPatientId = null;

    document.querySelectorAll('.btn-start-consultation').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.doctor-patient-card');
            const patientId = card ? card.getAttribute('data-patient-id') : '1';
            openConsultationTab(patientId, card);
        });
    });

    function openConsultationTab(patientId, cardElement) {
        currentConsultationPatientId = patientId;
        const pData = patientsMock[patientId] || patientsMock['1'];

        // Populate consultation tab info
        const nameEl = document.getElementById('consult-patient-name');
        const detailsEl = document.getElementById('consult-patient-details');
        const avatarEl = document.getElementById('consult-patient-avatar');
        const chronicEl = document.getElementById('consult-chronic-diseases');
        const medsEl = document.getElementById('consult-meds');
        const allergiesEl = document.getElementById('consult-allergies');

        if (nameEl) nameEl.textContent = pData.name;
        if (detailsEl) detailsEl.textContent = `${pData.age} • ${pData.gender} • CPF: ${pData.cpf} • ${pData.plan}`;
        if (chronicEl) chronicEl.textContent = pData.chronic;
        if (medsEl) medsEl.textContent = pData.meds;
        if (allergiesEl) {
            allergiesEl.textContent = pData.allergies;
            if (pData.allergies.toLowerCase().includes('nenhuma')) {
                allergiesEl.className = 'doc-fact-val';
            } else {
                allergiesEl.className = 'doc-fact-val alert-text';
            }
        }

        // Update card status in queue
        if (cardElement) {
            cardElement.setAttribute('data-status', 'ongoing');
            cardElement.classList.add('ongoing-card');
            const statusPill = cardElement.querySelector('.pill-patient-status');
            if (statusPill) {
                statusPill.className = 'status-pill ongoing';
                statusPill.style.background = '#E6F4EA';
                statusPill.style.color = '#1D6B35';
                statusPill.innerHTML = '<span class="dot" style="background: #1D6B35;"></span> Em Atendimento';
            }
        }

        // Switch to Consultation Tab
        const consultationTabBtn = document.querySelector('.bottom-nav .nav-btn[data-target="tab-doctor-consultation"]');
        if (consultationTabBtn) {
            consultationTabBtn.click();
        }
    }

    // Back to Queue Button
    const btnBackToQueue = document.getElementById('btn-back-to-queue');
    if (btnBackToQueue) {
        btnBackToQueue.addEventListener('click', () => {
            const agendaTabBtn = document.querySelector('.bottom-nav .nav-btn[data-target="tab-doctor-agenda"]');
            if (agendaTabBtn) agendaTabBtn.click();
        });
    }

    // Dynamic Prescription Items
    const btnAddPrescItem = document.getElementById('btn-add-prescription-item');
    const prescContainer = document.getElementById('prescription-items-container');

    if (btnAddPrescItem && prescContainer) {
        btnAddPrescItem.addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'prescription-row';
            row.innerHTML = `
                <input type="text" class="presc-med-name" placeholder="Nome do medicamento" style="flex: 2;">
                <input type="text" class="presc-posology" placeholder="Posologia / Instruções" style="flex: 3;">
                <button type="button" class="btn-remove-presc" title="Remover item">&times;</button>
            `;
            row.querySelector('.btn-remove-presc').addEventListener('click', () => row.remove());
            prescContainer.appendChild(row);
        });

        // Delegate removal for default rows
        prescContainer.querySelectorAll('.btn-remove-presc').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.prescription-row').remove();
            });
        });
    }

    // Print Recipe Modal
    const btnPrintRecipe = document.getElementById('btn-print-recipe');
    const recipeModal = document.getElementById('recipe-print-modal');

    if (btnPrintRecipe && recipeModal) {
        btnPrintRecipe.addEventListener('click', () => {
            const pName = document.getElementById('consult-patient-name')?.textContent || 'Maria Clara Silva';
            const modalPName = document.getElementById('modal-patient-name');
            const modalMedsList = document.getElementById('modal-medicines-list');
            const modalDate = document.getElementById('modal-print-date');

            if (modalPName) modalPName.textContent = pName;
            if (modalDate) {
                const today = new Date();
                modalDate.textContent = `Data: ${today.toLocaleDateString('pt-BR')}`;
            }

            if (modalMedsList) {
                modalMedsList.innerHTML = '';
                const rows = document.querySelectorAll('.prescription-row');
                let count = 0;
                rows.forEach(row => {
                    const medName = row.querySelector('.presc-med-name')?.value.trim();
                    const posology = row.querySelector('.presc-posology')?.value.trim();
                    if (medName) {
                        count++;
                        const li = document.createElement('li');
                        li.style.marginBottom = '12px';
                        li.innerHTML = `<strong>${medName}</strong><br><span style="color: #555; font-size: 13px;">${posology || 'Conforme orientação médica.'}</span>`;
                        modalMedsList.appendChild(li);
                    }
                });

                if (count === 0) {
                    modalMedsList.innerHTML = '<li><strong>Consulta / Atestado Médico</strong><br><span style="color: #555; font-size: 13px;">Paciente esteve em consulta médica no dia de hoje.</span></li>';
                }
            }

            recipeModal.style.display = 'flex';
        });
    }

    // Finish Consultation
    const btnFinishConsultation = document.getElementById('btn-finish-consultation');
    if (btnFinishConsultation) {
        btnFinishConsultation.addEventListener('click', () => {
            if (confirm('Deseja finalizar o atendimento e salvar o prontuário deste paciente?')) {
                if (currentConsultationPatientId) {
                    const card = document.querySelector(`.doctor-patient-card[data-patient-id="${currentConsultationPatientId}"]`);
                    if (card) {
                        card.setAttribute('data-status', 'done');
                        card.classList.remove('ongoing-card');
                        const actionRow = card.querySelector('.doc-action-row');
                        if (actionRow) {
                            actionRow.innerHTML = `
                                <span class="status-pill done"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Concluído</span>
                                <div class="doc-btn-group">
                                    <button class="btn-doctor-sec btn-start-consultation" style="font-size: 12px;">Ver Resumo</button>
                                </div>
                            `;
                            actionRow.querySelector('.btn-start-consultation')?.addEventListener('click', function(e) {
                                e.stopPropagation();
                                openConsultationTab(currentConsultationPatientId, card);
                            });
                        }
                    }
                }

                // Update Metrics Counts
                updateDoctorMetrics();

                alert('Atendimento concluído com sucesso! O prontuário foi arquivado.');

                const agendaTabBtn = document.querySelector('.bottom-nav .nav-btn[data-target="tab-doctor-agenda"]');
                if (agendaTabBtn) agendaTabBtn.click();
            }
        });
    }

    function updateDoctorMetrics() {
        const totalCards = document.querySelectorAll('.doctor-patient-card');
        let doneCount = 0;
        let waitingCount = 0;
        let ongoingCount = 0;

        totalCards.forEach(c => {
            const st = c.getAttribute('data-status');
            if (st === 'done') doneCount++;
            else if (st === 'ongoing') ongoingCount++;
            else waitingCount++;
        });

        const totalEl = document.getElementById('metric-total-count');
        const waitEl = document.getElementById('metric-waiting-count');
        const ongoingEl = document.getElementById('metric-ongoing-count');
        const doneEl = document.getElementById('metric-done-count');

        if (totalEl) totalEl.textContent = totalCards.length;
        if (waitEl) waitEl.textContent = waitingCount;
        if (ongoingEl) ongoingEl.textContent = ongoingCount;
        if (doneEl) doneEl.textContent = doneCount;
    }

    // Search in Doctor Patients Tab
    const searchDocPatientInput = document.getElementById('search-doctor-patient-input');
    if (searchDocPatientInput) {
        searchDocPatientInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.doc-patient-history-card');
            cards.forEach(card => {
                if (card.textContent.toLowerCase().includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Doctor Profile Save
    const btnSaveDoctorProfile = document.getElementById('btn-save-doctor-profile');
    if (btnSaveDoctorProfile) {
        btnSaveDoctorProfile.addEventListener('click', () => {
            const originalText = btnSaveDoctorProfile.textContent;
            btnSaveDoctorProfile.textContent = 'Perfil Atualizado!';
            btnSaveDoctorProfile.style.backgroundColor = '#1D6B35';
            setTimeout(() => {
                btnSaveDoctorProfile.textContent = originalText;
                btnSaveDoctorProfile.style.backgroundColor = '';
            }, 2500);
        });
    }
});

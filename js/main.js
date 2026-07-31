document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // Auth & Forms Handling (Java REST Integration)
    // ----------------------------------------------------
    const registerForm = document.querySelector('form[action="dashboard.html"]');
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
                    const err = await response.json();
                    alert(err.message || 'Erro ao registrar usuário.');
                }
            } catch (err) {
                console.warn('Backend endpoint indisponível, simulando cadastro:', err);
                window.location.href = 'info-adicionais.html';
            }
        });
    }

    const isLoginPage = window.location.pathname.includes('login.html');
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
                        window.location.href = 'dashboard.html';
                    } else {
                        const err = await response.json();
                        alert(err.message || 'E-mail ou senha inválidos.');
                    }
                } catch (err) {
                    console.warn('Backend endpoint indisponível, simulando login:', err);
                    window.location.href = 'dashboard.html';
                }
            });
        }
    }

    const infoForm = document.querySelector('.info-form');
    if (infoForm) {
        infoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const storedUser = JSON.parse(localStorage.getItem('checkupUser') || '{}');
            const userId = storedUser.id || 1;

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
                await fetch(`/api/users/${userId}/additional-info`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        birthDate, cep, cpf, phone, gender, healthPlan,
                        hasChronicDisease, takesContinuousMedication
                    })
                });
            } catch (err) {
                console.warn('Falha ao atualizar dados no backend Java:', err);
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
        "Consultas Clínicas Gerais": ["Dr. Carlos Silva", "Dra. Ana Mendes", "Dr. Roberto Costa"],
        "Psicologia e Psquiatria": ["Dra. Júlia Nogueira", "Dr. Fernando Almeida"],
        "Especialidades Médicas": ["Dr. Pedro Henrique", "Dra. Marina Santos", "Dra. Sofia Lima"],
        "Genética Médica": ["Dr. Ricardo Alves", "Dra. Beatriz Costa"],
        "Consultas Cirúrgicas": ["Dra. Camila Ribeiro", "Dr. João Paulo"],
        "Geriatria": ["Dr. Antônio Carlos", "Dra. Lúcia Freitas"],
        "Pediatria": ["Dra. Fernanda Gomes", "Dr. Lucas Martins"],
        "Outras especialidades": ["Dra. Mariana Silva", "Dr. André Santos"]
    };

    const timeSelect = document.getElementById('booking-time');
    if (timeSelect) {
        timeSelect.innerHTML = '<option value="" disabled selected>Selecione o horário</option>';
        for (let i = 9; i <= 23; i++) {
            let hour = i < 10 ? `0${i}:00` : `${i}:00`;
            let option = document.createElement('option');
            option.value = hour;
            option.textContent = hour;
            timeSelect.appendChild(option);
        }
    }

    const specialtyBtns = document.querySelectorAll('.specialty-btn:not(.admin-grid-btn)');
    const agendaHeader = document.getElementById('agenda-header');
    const specialtiesSection = document.getElementById('specialties-section');
    const bookingSection = document.getElementById('booking-section');
    const bookingTitle = document.getElementById('booking-title');
    const doctorSelect = document.getElementById('booking-doctor');
    const btnBackAgenda = document.getElementById('btn-back-agenda');

    if (specialtyBtns.length > 0 && bookingSection) {
        specialtyBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
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
                                option.value = doc.name;
                                option.textContent = doc.name;
                                doctorSelect.appendChild(option);
                            });
                        } else {
                            fallbackDoctors(specialtyName);
                        }
                    } else {
                        fallbackDoctors(specialtyName);
                    }
                } catch (e) {
                    fallbackDoctors(specialtyName);
                }

                agendaHeader.style.display = 'none';
                specialtiesSection.style.display = 'none';
                bookingSection.style.display = 'flex';
            });
        });
    }

    function fallbackDoctors(specialtyName) {
        const doctors = doctorsDB[specialtyName] || ["Dr. Plantonista 1", "Dra. Plantonista 2"];
        doctors.forEach(doc => {
            let option = document.createElement('option');
            option.value = doc;
            option.textContent = doc;
            doctorSelect.appendChild(option);
        });
    }

    if (btnBackAgenda) {
        btnBackAgenda.addEventListener('click', () => {
            bookingSection.style.display = 'none';
            agendaHeader.style.display = 'block';
            specialtiesSection.style.display = 'grid';
        });
    }

    // Admin Grid Navigation
    const adminGridBtns = document.querySelectorAll('.admin-grid-btn');
    const adminMainMenu = document.getElementById('admin-main-menu');
    const adminSections = document.querySelectorAll('.admin-section');
    const btnBackAdmins = document.querySelectorAll('.btn-back-admin');
    if (adminGridBtns.length > 0 && adminMainMenu) {
        adminGridBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    adminMainMenu.style.display = 'none';
                    adminSections.forEach(sec => sec.style.display = 'none');
                    targetSection.style.display = targetSection.classList.contains('booking-section') ? 'flex' : 'block';
                    if (targetSection.classList.contains('history-container') && targetId !== 'admin-agenda') {
                        targetSection.style.display = 'flex';
                    }
                }
            });
        });
        btnBackAdmins.forEach(btn => {
            btn.addEventListener('click', () => {
                adminSections.forEach(sec => sec.style.display = 'none');
                adminMainMenu.style.display = 'block';
            });
        });
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

            const historyList = document.getElementById('history-list');
            if (historyList) {
                let currentMonthDiv = null;
                let hasVisibleCardsInMonth = false;
                Array.from(historyList.children).forEach(child => {
                    if (child.classList.contains('history-month')) {
                        if (currentMonthDiv !== null) {
                            currentMonthDiv.style.display = hasVisibleCardsInMonth ? 'block' : 'none';
                        }
                        currentMonthDiv = child;
                        hasVisibleCardsInMonth = false;
                    } else if (child.classList.contains('history-card')) {
                        if (child.style.display === 'flex' || child.style.display === '') {
                            hasVisibleCardsInMonth = true;
                        }
                    }
                });
                if (currentMonthDiv !== null) {
                    currentMonthDiv.style.display = hasVisibleCardsInMonth ? 'block' : 'none';
                }
            }
        });
    }

    // Cancel Button for default card
    const btnCancelAppt = document.getElementById('btn-cancel-1');
    const pillStatus1 = document.getElementById('pill-status-1');
    if (btnCancelAppt && pillStatus1) {
        btnCancelAppt.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja cancelar esta consulta? A ação não pode ser desfeita.')) {
                pillStatus1.classList.remove('ongoing');
                pillStatus1.classList.add('cancelled');
                pillStatus1.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Cancelada';
                btnCancelAppt.style.display = 'none';
            }
        });
    }

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
    const profileInputs = document.querySelectorAll('#tab-perfil input, #tab-perfil select');
    profileInputs.forEach(input => {
        if (input.type !== 'file') {
            input.addEventListener('input', () => hasUnsavedChanges = true);
            input.addEventListener('change', () => hasUnsavedChanges = true);
        }
    });

    const avatarBtn = document.getElementById('profile-avatar-btn');
    const imageUpload = document.getElementById('profile-image-upload');
    const imagePreview = document.getElementById('profile-image-preview');
    const imageIcon = document.getElementById('profile-image-icon');
    if (avatarBtn && imageUpload) {
        avatarBtn.addEventListener('click', () => imageUpload.click());

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
            const daySelect = document.getElementById('booking-day');
            const timeSelect = document.getElementById('booking-time');
            if (!docSelect.value || !daySelect.value || !timeSelect.value) {
                alert("Por favor, preencha todos os campos (dia, horário e médico) antes de confirmar.");
                return;
            }
            const specialty = document.getElementById('booking-title').textContent.replace('Agendando: ', '');
            const doctor = docSelect.value;
            const dayText = daySelect.options[daySelect.selectedIndex].text;
            const timeText = timeSelect.options[timeSelect.selectedIndex].text;

            const storedUser = JSON.parse(localStorage.getItem('checkupUser') || '{}');
            const userId = storedUser.id || 1;

            try {
                await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userId,
                        doctorName: doctor,
                        specialty: specialty,
                        appointmentDate: dayText,
                        appointmentTime: timeText
                    })
                });
            } catch (err) {
                console.warn('Aviso: Falha ao comunicar agendamento com backend Java:', err);
            }

            const newCard = document.createElement('div');
            newCard.className = 'history-card';
            newCard.setAttribute('data-search', `${doctor} ${specialty}`.toLowerCase());
            newCard.innerHTML = `
                <div class="history-card-top-right">Agendada</div>
                <div class="history-row">
                    <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <strong>${specialty}</strong>
                </div>
                <div class="history-row">
                    <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>Unidade Central – Sala a definir</span>
                </div>
                <div class="history-row">
                    <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>${doctor}</span>
                </div>
                <div class="history-row space-between">
                    <div class="h-col">
                        <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>${dayText} às ${timeText}</span>
                    </div>
                    <div class="h-actions">
                        <span class="status-pill ongoing">
                            <span class="dot"></span> Em andamento
                        </span>
                        <button class="btn-cancel-appt" title="Cancelar Consulta">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
            `;
            const cancelBtn = newCard.querySelector('.btn-cancel-appt');
            cancelBtn.addEventListener('click', function() {
                const confirmCancel = confirm('Tem certeza que deseja cancelar esta consulta?');
                if (confirmCancel) {
                    const pill = newCard.querySelector('.status-pill');
                    pill.className = 'status-pill cancelled';
                    pill.innerHTML = '<span class="dot"></span> Cancelada';
                    this.style.display = 'none';
                }
            });
            const historyList = document.getElementById('history-list');
            let futurasLabel = document.getElementById('label-futuras');
            if (futurasLabel) {
                futurasLabel.style.display = 'block';
                futurasLabel.insertAdjacentElement('afterend', newCard);
            } else if (historyList) {
                historyList.prepend(newCard);
            }
            historyCards = document.querySelectorAll('.history-card');
            alert('Agendamento confirmado com sucesso! Você pode visualizar sua consulta na aba de Histórico.');
            document.getElementById('booking-section').style.display = 'none';
            document.getElementById('agenda-header').style.display = 'block';
            document.getElementById('specialties-section').style.display = 'grid';
            docSelect.value = '';
            daySelect.value = '';
            timeSelect.value = '';
        });
    }

    // ----------------------------------------------------
    // Save Profile (API + UI update)
    // ----------------------------------------------------
    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', async () => {
            if (!hasUnsavedChanges) return;

            const storedUser = JSON.parse(localStorage.getItem('checkupUser') || '{}');
            const userId = storedUser.id || 1;

            const nameInput = document.getElementById('nome-profile');
            const emailInput = document.getElementById('email-profile');
            const birthInput = document.getElementById('nascimento-profile');
            const cepInputProf = document.getElementById('cep-profile');
            const cpfInputProf = document.getElementById('cpf-profile');
            const phoneInputProf = document.getElementById('contato-profile');

            try {
                await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: nameInput ? nameInput.value : undefined,
                        email: emailInput ? emailInput.value : undefined,
                        birthDate: birthInput ? birthInput.value : undefined,
                        cep: cepInputProf ? cepInputProf.value : undefined,
                        cpf: cpfInputProf ? cpfInputProf.value : undefined,
                        phone: phoneInputProf ? phoneInputProf.value : undefined,
                        avatarUrl: imagePreview ? imagePreview.src : undefined
                    })
                });
            } catch (err) {
                console.warn('Aviso: Falha ao atualizar perfil no Java backend:', err);
            }

            const originalText = btnSaveProfile.textContent;
            btnSaveProfile.textContent = 'Informações atualizadas!';
            btnSaveProfile.style.backgroundColor = '#1D6B35';
            hasUnsavedChanges = false;

            setTimeout(() => {
                btnSaveProfile.textContent = originalText;
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
        if (avatarEl) {
            avatarEl.textContent = pData.initials;
            avatarEl.style.background = pData.avatarBg;
        }
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
                btnSaveDoctorProfile.style.backgroundColor = '#0056D2';
            }, 2500);
        });
    }
});

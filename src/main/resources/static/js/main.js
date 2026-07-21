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

    const loginForm = document.querySelector('form[action="dashboard.html"]') === null ? document.querySelector('form[action="dashboard.html"]') : null;
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

    const specialtyBtns = document.querySelectorAll('.specialty-btn');
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
});

document.addEventListener('DOMContentLoaded', async () => {
    const state = {clients: [], doctors: [], specialties: [], appointments: [], windowStart: '', windowEnd: ''};
    const titles = {overview: 'Visão geral', appointments: 'Consultas', specialties: 'Tipos de consulta', users: 'Usuários'};
    const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

    function toast(message, error = false) {
        const element = document.getElementById('admin-toast');
        element.textContent = message;
        element.className = `admin-toast show${error ? ' error' : ''}`;
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => element.className = 'admin-toast', 3500);
    }

    async function api(url, options = {}) {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
            window.location.href = 'admin-login.html';
            throw new Error('Sessão administrativa encerrada.');
        }
        if (!response.ok) throw new Error(data.message || 'Não foi possível concluir a operação.');
        return data;
    }

    function openTab(name) {
        document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.toggle('active', tab.id === `admin-tab-${name}`));
        document.querySelectorAll('.admin-nav-btn').forEach(button => button.classList.toggle('active', button.dataset.adminTab === name));
        document.getElementById('admin-page-title').textContent = titles[name];
    }

    document.querySelectorAll('[data-admin-tab]').forEach(button => button.addEventListener('click', () => openTab(button.dataset.adminTab)));
    document.querySelectorAll('[data-open-tab]').forEach(button => button.addEventListener('click', () => openTab(button.dataset.openTab)));
    document.getElementById('admin-logout').addEventListener('click', async () => {
        await fetch('/api/auth/logout', {method: 'POST'});
        window.location.href = 'admin-login.html';
    });

    function statusLabel(status) {
        return ({AGENDADO:'Agendada', CONCLUIDO:'Concluída', CANCELADO:'Cancelada'})[status] || status;
    }

    function appointmentCard(appointment, allowCancel = true) {
        const searchable = `${appointment.user?.name || ''} ${appointment.doctorName || ''} ${appointment.specialty || ''}`.toLowerCase();
        return `<article class="record-card" data-search="${escapeHtml(searchable)}">
            <div class="record-main"><strong>${escapeHtml(appointment.user?.name || 'Paciente')}</strong><p>${escapeHtml(appointment.specialty)} · ${escapeHtml(appointment.doctorName)} · ${escapeHtml(appointment.appointmentDate)} às ${escapeHtml(appointment.appointmentTime)}</p></div>
            <div class="record-side"><span class="status-pill ${appointment.status === 'CANCELADO' ? 'cancelled' : ''}">${escapeHtml(statusLabel(appointment.status))}</span>${allowCancel && appointment.status === 'AGENDADO' ? `<button class="danger-btn" data-cancel-appointment="${appointment.id}">Desmarcar</button>` : ''}</div>
        </article>`;
    }

    function renderAppointments() {
        const full = document.getElementById('admin-appointments-list');
        const recent = document.getElementById('overview-appointments');
        const empty = '<div class="empty-state">Nenhuma consulta cadastrada.</div>';
        full.innerHTML = state.appointments.length ? state.appointments.map(item => appointmentCard(item)).join('') : empty;
        recent.innerHTML = state.appointments.length ? state.appointments.slice(0, 4).map(item => appointmentCard(item, false)).join('') : empty;
    }

    function renderSpecialties() {
        document.getElementById('specialty-list').innerHTML = state.specialties.length
            ? state.specialties.map(item => `<span class="specialty-chip">${escapeHtml(item.name)}<button class="icon-delete" title="Remover" aria-label="Remover ${escapeHtml(item.name)}" data-delete-specialty="${item.id}">×</button></span>`).join('')
            : '<div class="empty-state">Nenhum tipo de consulta cadastrado.</div>';
        document.getElementById('admin-specialty').innerHTML = '<option value="">Selecione o tipo</option>' + state.specialties.map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join('');
    }

    function renderClients() {
        document.getElementById('admin-patient').innerHTML = '<option value="">Selecione o paciente</option>' + state.clients.map(user => `<option value="${user.id}">${escapeHtml(user.name)} · ${escapeHtml(user.email)}</option>`).join('');
        document.getElementById('client-list').innerHTML = state.clients.length ? state.clients.map(user => `<article class="record-card" data-search="${escapeHtml(`${user.name} ${user.email}`.toLowerCase())}"><div class="record-main"><strong>${escapeHtml(user.name)}</strong><p>${escapeHtml(user.email)}${user.phone ? ` · ${escapeHtml(user.phone)}` : ''}</p></div><button class="danger-btn" data-delete-user="${user.id}">Excluir perfil</button></article>`).join('') : '<div class="empty-state">Nenhum paciente cadastrado.</div>';
    }

    function renderDoctors() {
        document.getElementById('doctor-list').innerHTML = state.doctors.length ? state.doctors.map(doctor => `<article class="record-card"><div class="record-main"><strong>${escapeHtml(doctor.name)}</strong><p>${escapeHtml(doctor.specialty)}${doctor.crm ? ` · ${escapeHtml(doctor.crm)}` : ''}</p></div><button class="danger-btn" data-delete-doctor="${doctor.id}">Excluir perfil</button></article>`).join('') : '<div class="empty-state">Nenhum perfil médico cadastrado.</div>';
    }

    async function loadAll() {
        const [me, summary, clients, doctors, specialties, appointments, bookingWindow] = await Promise.all([
            api('/api/admin/auth/me'), api('/api/admin/summary'), api('/api/admin/users?role=CLIENT'),
            api('/api/admin/doctors'), api('/api/admin/specialties'), api('/api/admin/appointments'), api('/api/appointments/window')
        ]);
        state.clients = clients; state.doctors = doctors; state.specialties = specialties; state.appointments = appointments;
        state.windowStart = bookingWindow.startDateTime; state.windowEnd = bookingWindow.endDateTime;
        document.getElementById('admin-name').textContent = me.name;
        document.getElementById('admin-email').textContent = me.email;
        document.getElementById('metric-clients').textContent = summary.clients;
        document.getElementById('metric-appointments').textContent = summary.appointments;
        document.getElementById('metric-specialties').textContent = summary.specialties;
        document.getElementById('metric-doctors').textContent = summary.doctorProfiles;
        const date = document.getElementById('admin-date');
        date.min = state.windowStart.slice(0, 10); date.max = state.windowEnd.slice(0, 10);
        renderClients(); renderDoctors(); renderSpecialties(); renderAppointments();
    }

    function populateTimes() {
        const date = document.getElementById('admin-date').value;
        const select = document.getElementById('admin-time');
        select.innerHTML = '<option value="">Selecione o horário</option>';
        if (!date) return;
        for (let hour = 9; hour <= 23; hour++) {
            const time = `${String(hour).padStart(2, '0')}:00`;
            const value = `${date}T${time}`;
            if (value >= state.windowStart && value <= state.windowEnd) select.insertAdjacentHTML('beforeend', `<option value="${time}">${time}</option>`);
        }
    }

    document.getElementById('admin-date').addEventListener('change', populateTimes);
    document.getElementById('admin-specialty').addEventListener('change', async event => {
        const select = document.getElementById('admin-doctor');
        select.disabled = true; select.innerHTML = '<option value="">Carregando médicos...</option>';
        if (!event.target.value) return;
        try {
            const doctors = await api(`/api/doctors/specialty?name=${encodeURIComponent(event.target.value)}`);
            select.innerHTML = '<option value="">Selecione o médico</option>' + doctors.map(doctor => `<option value="${escapeHtml(doctor.name)}">${escapeHtml(doctor.name)}</option>`).join('');
            select.disabled = doctors.length === 0;
            if (!doctors.length) select.innerHTML = '<option value="">Nenhum médico disponível</option>';
        } catch (error) { toast(error.message, true); }
    });

    document.getElementById('admin-appointment-form').addEventListener('submit', async event => {
        event.preventDefault();
        try {
            await api('/api/admin/appointments', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
                patientId:Number(document.getElementById('admin-patient').value), specialty:document.getElementById('admin-specialty').value,
                doctorName:document.getElementById('admin-doctor').value, appointmentDate:document.getElementById('admin-date').value,
                appointmentTime:document.getElementById('admin-time').value, observation:document.getElementById('admin-observation').value
            })});
            event.target.reset(); document.getElementById('admin-doctor').disabled = true; populateTimes();
            state.appointments = await api('/api/admin/appointments'); renderAppointments();
            document.getElementById('metric-appointments').textContent = state.appointments.length;
            toast('Consulta marcada com sucesso.');
        } catch (error) { toast(error.message, true); }
    });

    document.getElementById('specialty-form').addEventListener('submit', async event => {
        event.preventDefault();
        try {
            await api('/api/admin/specialties', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:document.getElementById('specialty-name').value})});
            document.getElementById('specialty-name').value = '';
            state.specialties = await api('/api/admin/specialties'); renderSpecialties();
            document.getElementById('metric-specialties').textContent = state.specialties.length;
            toast('Tipo de consulta adicionado.');
        } catch (error) { toast(error.message, true); }
    });

    document.addEventListener('click', async event => {
        const specialtyId = event.target.dataset.deleteSpecialty;
        const userId = event.target.dataset.deleteUser;
        const doctorId = event.target.dataset.deleteDoctor;
        const appointmentId = event.target.dataset.cancelAppointment;
        try {
            if (specialtyId && confirm('Remover este tipo de consulta da agenda?')) {
                await api(`/api/admin/specialties/${specialtyId}`, {method:'DELETE'}); state.specialties = await api('/api/admin/specialties'); renderSpecialties(); document.getElementById('metric-specialties').textContent = state.specialties.length; toast('Tipo de consulta removido.');
            }
            if (userId && confirm('Excluir este paciente e todas as consultas dele? Esta ação não pode ser desfeita.')) {
                await api(`/api/admin/users/${userId}`, {method:'DELETE'}); state.clients = await api('/api/admin/users?role=CLIENT'); state.appointments = await api('/api/admin/appointments'); renderClients(); renderAppointments(); document.getElementById('metric-clients').textContent = state.clients.length; document.getElementById('metric-appointments').textContent = state.appointments.length; toast('Perfil do paciente excluído.');
            }
            if (doctorId && confirm('Excluir este perfil médico?')) {
                await api(`/api/admin/doctors/${doctorId}`, {method:'DELETE'}); state.doctors = await api('/api/admin/doctors'); renderDoctors(); document.getElementById('metric-doctors').textContent = state.doctors.length; toast('Perfil médico excluído.');
            }
            if (appointmentId && confirm('Desmarcar esta consulta?')) {
                await api(`/api/admin/appointments/${appointmentId}/cancel`, {method:'PUT'}); state.appointments = await api('/api/admin/appointments'); renderAppointments(); toast('Consulta desmarcada.');
            }
        } catch (error) { toast(error.message, true); }
    });

    function bindSearch(inputId, containerId) {
        document.getElementById(inputId).addEventListener('input', event => {
            const term = event.target.value.trim().toLowerCase();
            document.querySelectorAll(`#${containerId} [data-search]`).forEach(card => card.style.display = card.dataset.search.includes(term) ? '' : 'none');
        });
    }
    bindSearch('appointment-search', 'admin-appointments-list'); bindSearch('user-search', 'client-list');

    try { await loadAll(); } catch (error) { if (!location.pathname.endsWith('admin-login.html')) toast(error.message, true); }
});

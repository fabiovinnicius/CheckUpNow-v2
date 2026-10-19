document.addEventListener('DOMContentLoaded', async () => {
    const state = {clients: [], doctors: [], specialties: [], appointments: [], windowStart: '', windowEnd: '', agendaDoctorId: null};
    const titles = {overview: 'Visão geral', appointments: 'Consultas', specialties: 'Tipos de consulta', 'doctor-agenda': 'Agenda médica', users: 'Usuários'};
    const weekDays = [['MONDAY','Segunda-feira'],['TUESDAY','Terça-feira'],['WEDNESDAY','Quarta-feira'],['THURSDAY','Quinta-feira'],['FRIDAY','Sexta-feira'],['SATURDAY','Sábado'],['SUNDAY','Domingo']];
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

    function documentTypeLabel(type) {
        return ({ATESTADO:'Atestado', RECEITA:'Receita', EXAME:'Exame', OUTRO:'Outro'})[type] || type;
    }

    async function loadAppointmentDocuments(appointmentId) {
        const containers = document.querySelectorAll(`[data-admin-documents="${appointmentId}"]`);
        if (!containers.length) return;
        try {
            const documents = await api(`/api/medical-documents/appointments/${appointmentId}`);
            const html = documents.length
                ? documents.map(document => `<a class="document-link" href="${document.downloadUrl}" target="_blank" rel="noopener">${escapeHtml(documentTypeLabel(document.type))}: ${escapeHtml(document.title)}</a>`).join('')
                : '<span class="document-empty">Nenhum documento enviado.</span>';
            containers.forEach(container => container.innerHTML = html);
        } catch (error) {
            containers.forEach(container => container.innerHTML = '<span class="document-empty">Falha ao carregar documentos.</span>');
        }
    }

    function appointmentCard(appointment, allowCancel = true) {
        const searchable = `${appointment.user?.name || ''} ${appointment.doctorName || ''} ${appointment.specialty || ''}`.toLowerCase();
        return `<article class="record-card appointment-record" data-search="${escapeHtml(searchable)}">
            <div class="record-main appointment-info"><strong>${escapeHtml(appointment.user?.name || 'Paciente')}</strong><p>${escapeHtml(appointment.specialty)} · ${escapeHtml(appointment.doctorName)} · ${escapeHtml(appointment.appointmentDate)} às ${escapeHtml(appointment.appointmentTime)}</p>${appointment.status === 'CONCLUIDO' ? `<div class="document-list" data-admin-documents="${appointment.id}"><span class="document-empty">Carregando documentos...</span></div>${allowCancel ? `<form class="medical-upload-form" data-appointment-id="${appointment.id}"><select name="type" required><option value="ATESTADO">Atestado</option><option value="RECEITA">Receita</option><option value="EXAME">Exame</option><option value="OUTRO">Outro</option></select><input name="title" maxlength="150" placeholder="Título do documento"><input name="file" type="file" accept="application/pdf,.pdf" required><button class="btn-primary upload-button" type="submit">Enviar PDF</button></form>` : ''}` : ''}</div>
            <div class="record-side"><span class="status-pill ${appointment.status === 'CANCELADO' ? 'cancelled' : ''}">${escapeHtml(statusLabel(appointment.status))}</span>${allowCancel && appointment.status === 'AGENDADO' ? `<button class="danger-btn" data-cancel-appointment="${appointment.id}">Desmarcar</button>` : ''}</div>
        </article>`;
    }

    function renderAppointments() {
        const full = document.getElementById('admin-appointments-list');
        const recent = document.getElementById('overview-appointments');
        const empty = '<div class="empty-state">Nenhuma consulta cadastrada.</div>';
        full.innerHTML = state.appointments.length ? state.appointments.map(item => appointmentCard(item)).join('') : empty;
        recent.innerHTML = state.appointments.length ? state.appointments.slice(0, 4).map(item => appointmentCard(item, false)).join('') : empty;
        document.querySelectorAll('[data-admin-documents]').forEach(element => loadAppointmentDocuments(element.dataset.adminDocuments));
    }

    function renderSpecialties() {
        document.getElementById('specialty-list').innerHTML = state.specialties.length
            ? state.specialties.map(item => `<span class="specialty-chip">${escapeHtml(item.name)}<button class="icon-delete" title="Remover" aria-label="Remover ${escapeHtml(item.name)}" data-delete-specialty="${item.id}">×</button></span>`).join('')
            : '<div class="empty-state">Nenhum tipo de consulta cadastrado.</div>';
        document.getElementById('admin-specialty').innerHTML = '<option value="">Selecione o tipo</option>' + state.specialties.map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join('');
        document.getElementById('new-doctor-specialty').innerHTML = '<option value="">Selecione a especialidade</option>' + state.specialties.map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join('');
    }

    function renderClients() {
        document.getElementById('admin-patient').innerHTML = '<option value="">Selecione o paciente</option>' + state.clients.map(user => `<option value="${user.id}">${escapeHtml(user.name)} · ${escapeHtml(user.email)}</option>`).join('');
        document.getElementById('client-list').innerHTML = state.clients.length ? state.clients.map(user => `<article class="record-card" data-search="${escapeHtml(`${user.name} ${user.email}`.toLowerCase())}"><div class="record-main"><strong>${escapeHtml(user.name)}</strong><p>${escapeHtml(user.email)}${user.phone ? ` · ${escapeHtml(user.phone)}` : ''}</p></div><button class="danger-btn" data-delete-user="${user.id}">Excluir perfil</button></article>`).join('') : '<div class="empty-state">Nenhum paciente cadastrado.</div>';
    }

    function renderDoctors() {
        document.getElementById('doctor-list').innerHTML = state.doctors.length ? state.doctors.map(doctor => `<article class="record-card"><div class="record-main"><strong>${escapeHtml(doctor.name)}</strong><p>${escapeHtml(doctor.specialty)}${doctor.crm ? ` · ${escapeHtml(doctor.crm)}` : ''}${doctor.user ? ` · Acesso: ${escapeHtml(doctor.user.email)}` : ' · Sem acesso ao portal'}</p></div><div class="record-side"><button class="secondary-btn" data-manage-doctor="${doctor.id}">Gerenciar agenda</button><button class="danger-btn" data-delete-doctor="${doctor.id}">Excluir perfil</button></div></article>`).join('') : '<div class="empty-state">Nenhum perfil médico cadastrado.</div>';
        document.getElementById('agenda-doctor').innerHTML = '<option value="">Selecione o médico</option>' + state.doctors.map(doctor => `<option value="${doctor.id}">${escapeHtml(doctor.name)} · ${escapeHtml(doctor.specialty)}</option>`).join('');
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

    async function populateTimes() {
        const date = document.getElementById('admin-date').value;
        const doctorId = document.getElementById('admin-doctor').value;
        const select = document.getElementById('admin-time');
        select.innerHTML = '<option value="">Selecione o horário</option>';
        if (!date || !doctorId) return;
        try { const times = await api(`/api/doctors/${doctorId}/available-times?date=${date}`); select.innerHTML = times.length ? '<option value="">Selecione o horário</option>' + times.map(time => `<option value="${time}">${time}</option>`).join('') : '<option value="">Nenhum horário disponível</option>'; }
        catch (error) { toast(error.message, true); }
    }

    document.getElementById('admin-date').addEventListener('change', populateTimes);
    document.getElementById('admin-specialty').addEventListener('change', async event => {
        const select = document.getElementById('admin-doctor');
        select.disabled = true; select.innerHTML = '<option value="">Carregando médicos...</option>';
        if (!event.target.value) return;
        try {
            const doctors = await api(`/api/doctors/specialty?name=${encodeURIComponent(event.target.value)}`);
            select.innerHTML = '<option value="">Selecione o médico</option>' + doctors.map(doctor => `<option value="${doctor.id}">${escapeHtml(doctor.name)}</option>`).join('');
            select.disabled = doctors.length === 0;
            if (!doctors.length) select.innerHTML = '<option value="">Nenhum médico disponível</option>';
        } catch (error) { toast(error.message, true); }
    });
    document.getElementById('admin-doctor').addEventListener('change', populateTimes);

    document.getElementById('admin-appointment-form').addEventListener('submit', async event => {
        event.preventDefault();
        try {
            await api('/api/admin/appointments', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
                patientId:Number(document.getElementById('admin-patient').value), specialty:document.getElementById('admin-specialty').value,
                doctorId:Number(document.getElementById('admin-doctor').value), appointmentDate:document.getElementById('admin-date').value,
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

    document.addEventListener('submit', async event => {
        const form = event.target.closest('.medical-upload-form');
        if (!form) return;
        event.preventDefault();
        const button = form.querySelector('button');
        button.disabled = true;
        try {
            await api(`/api/medical-documents/appointments/${form.dataset.appointmentId}`, {method:'POST', body:new FormData(form)});
            form.reset();
            await loadAppointmentDocuments(form.dataset.appointmentId);
            toast('Documento médico enviado ao paciente.');
        } catch (error) { toast(error.message, true); }
        finally { button.disabled = false; }
    });

    function selectedAgendaDoctor() { return state.doctors.find(doctor => doctor.id === Number(state.agendaDoctorId)); }

    function renderAdminHours(rows) {
        const byDay = Object.fromEntries(rows.map(row => [row.dayOfWeek, row]));
        document.getElementById('admin-working-hours-grid').innerHTML = weekDays.map(([key, label]) => {
            const row = byDay[key];
            return `<div class="admin-hour-row ${row ? '' : 'disabled'}" data-day="${key}"><label><input type="checkbox" ${row ? 'checked' : ''}>${label}</label><input class="admin-hour-start" type="time" value="${row?.startTime?.slice(0,5) || '09:00'}" ${row ? '' : 'disabled'}><input class="admin-hour-end" type="time" value="${row?.endTime?.slice(0,5) || '18:00'}" ${row ? '' : 'disabled'}></div>`;
        }).join('');
        document.querySelectorAll('.admin-hour-row input[type=checkbox]').forEach(input => input.addEventListener('change', () => {
            const row = input.closest('.admin-hour-row'); row.classList.toggle('disabled', !input.checked);
            row.querySelectorAll('input[type=time]').forEach(time => time.disabled = !input.checked);
        }));
    }

    function renderAdminBlocks(rows) {
        document.getElementById('admin-doctor-blocks').innerHTML = rows.length ? rows.map(block => `<article class="record-card"><div class="record-main"><strong>${escapeHtml(block.reason)}</strong><p>${new Date(block.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(block.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p></div><button class="danger-btn" data-admin-delete-block="${block.id}">Remover</button></article>`).join('') : '<div class="empty-state">Nenhum período bloqueado.</div>';
    }

    async function loadDoctorAgenda(doctorId) {
        state.agendaDoctorId = Number(doctorId);
        const doctor = selectedAgendaDoctor();
        document.getElementById('doctor-agenda-content').hidden = !doctor;
        if (!doctor) return;
        document.getElementById('agenda-doctor').value = doctor.id;
        const accountForm = document.getElementById('doctor-account-form');
        document.getElementById('doctor-account-status').textContent = doctor.user ? `Acesso ativo: ${doctor.user.email}` : 'Este médico ainda não possui conta.';
        [...accountForm.elements].forEach(element => element.disabled = Boolean(doctor.user));
        const [hours, blocks] = await Promise.all([api(`/api/admin/doctors/${doctor.id}/working-hours`), api(`/api/admin/doctors/${doctor.id}/blocks`)]);
        renderAdminHours(hours); renderAdminBlocks(blocks);
    }

    document.getElementById('agenda-doctor').addEventListener('change', event => loadDoctorAgenda(event.target.value).catch(error => toast(error.message, true)));
    document.getElementById('create-doctor-form').addEventListener('submit', async event => {
        event.preventDefault();
        try {
            const doctor = await api('/api/admin/doctors', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
                name:document.getElementById('new-doctor-name').value,
                specialty:document.getElementById('new-doctor-specialty').value,
                crm:document.getElementById('new-doctor-crm').value,
                email:document.getElementById('new-doctor-email').value,
                password:document.getElementById('new-doctor-password').value
            })});
            event.target.reset(); state.doctors = await api('/api/admin/doctors'); renderDoctors();
            document.getElementById('metric-doctors').textContent = state.doctors.length;
            await loadDoctorAgenda(doctor.id); toast('Médico e conta de acesso cadastrados.');
        } catch (error) { toast(error.message, true); }
    });
    document.getElementById('doctor-account-form').addEventListener('submit', async event => {
        event.preventDefault();
        try {
            await api(`/api/admin/doctors/${state.agendaDoctorId}/account`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:document.getElementById('doctor-account-email').value, password:document.getElementById('doctor-account-password').value})});
            state.doctors = await api('/api/admin/doctors'); renderDoctors(); await loadDoctorAgenda(state.agendaDoctorId); toast('Acesso do médico criado.');
        } catch (error) { toast(error.message, true); }
    });
    document.getElementById('admin-working-hours-form').addEventListener('submit', async event => {
        event.preventDefault();
        const rows = [...document.querySelectorAll('.admin-hour-row')].filter(row => row.querySelector('input[type=checkbox]').checked).map(row => ({dayOfWeek:row.dataset.day, startTime:row.querySelector('.admin-hour-start').value, endTime:row.querySelector('.admin-hour-end').value}));
        try { renderAdminHours(await api(`/api/admin/doctors/${state.agendaDoctorId}/working-hours`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(rows)})); toast('Horários do médico salvos.'); }
        catch (error) { toast(error.message, true); }
    });
    document.getElementById('admin-block-form').addEventListener('submit', async event => {
        event.preventDefault();
        try { await api(`/api/admin/doctors/${state.agendaDoctorId}/blocks`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({startDate:document.getElementById('admin-block-start').value, endDate:document.getElementById('admin-block-end').value, reason:document.getElementById('admin-block-reason').value})}); event.target.reset(); renderAdminBlocks(await api(`/api/admin/doctors/${state.agendaDoctorId}/blocks`)); toast('Agenda do médico bloqueada.'); }
        catch (error) { toast(error.message, true); }
    });

    document.addEventListener('click', async event => {
        const specialtyId = event.target.dataset.deleteSpecialty;
        const userId = event.target.dataset.deleteUser;
        const doctorId = event.target.dataset.deleteDoctor;
        const appointmentId = event.target.dataset.cancelAppointment;
        const manageDoctorId = event.target.dataset.manageDoctor;
        const adminBlockId = event.target.dataset.adminDeleteBlock;
        try {
            if (manageDoctorId) { openTab('doctor-agenda'); await loadDoctorAgenda(manageDoctorId); }
            if (adminBlockId && confirm('Remover este bloqueio da agenda?')) { await api(`/api/admin/doctors/${state.agendaDoctorId}/blocks/${adminBlockId}`, {method:'DELETE'}); renderAdminBlocks(await api(`/api/admin/doctors/${state.agendaDoctorId}/blocks`)); toast('Bloqueio removido.'); }
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

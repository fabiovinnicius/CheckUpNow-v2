import { api } from './api.js';
import { escapeHtml, formatDate, setButtonLoading } from './ui.js';

export function initBooking({ notify, onAppointmentCreated }) {
    const specialties = document.getElementById('specialties-section');
    const header = document.getElementById('agenda-header');
    const section = document.getElementById('booking-section');
    const form = document.getElementById('booking-form');
    const title = document.getElementById('booking-title');
    const doctor = document.getElementById('booking-doctor');
    const date = document.getElementById('booking-date');
    const time = document.getElementById('booking-time');
    const feedback = document.getElementById('booking-feedback');
    const review = document.getElementById('booking-review');
    const reviewContent = document.getElementById('booking-review-content');
    const continueButton = document.getElementById('btn-review-booking');
    const confirmButton = document.getElementById('btn-confirm-booking');
    let specialty = '';
    let windowStart = '';
    let windowEnd = '';

    function setFeedback(message = '', type = 'info') {
        feedback.textContent = message;
        feedback.className = message ? `booking-feedback show ${type}` : 'booking-feedback';
    }

    function setSelect(select, placeholder, disabled = true) {
        select.innerHTML = `<option value="" selected disabled>${placeholder}</option>`;
        select.disabled = disabled;
    }

    async function loadWindow() {
        const data = await api('/api/appointments/window');
        windowStart = data.startDateTime;
        windowEnd = data.endDateTime;
        date.min = windowStart.slice(0, 10);
        date.max = windowEnd.slice(0, 10);
    }

    async function loadSpecialties() {
        specialties.innerHTML = '<div class="content-loading"><span class="loading-spinner"></span>Carregando especialidades...</div>';
        try {
            const items = await api('/api/specialties');
            specialties.innerHTML = items.length
                ? items.map(item => `<button type="button" class="specialty-btn">${escapeHtml(item.name)}</button>`).join('')
                : '<div class="inline-empty">Nenhuma especialidade disponível no momento.</div>';
        } catch (error) {
            specialties.innerHTML = `<div class="inline-error"><span>${escapeHtml(error.message)}</span><button type="button" id="retry-specialties">Tentar novamente</button></div>`;
            document.getElementById('retry-specialties')?.addEventListener('click', loadSpecialties);
        }
    }

    async function selectSpecialty(name) {
        specialty = name;
        title.textContent = specialty;
        header.hidden = true;
        specialties.hidden = true;
        section.hidden = false;
        form.hidden = false;
        review.hidden = true;
        setFeedback();
        setSelect(doctor, 'Carregando médicos...');
        setSelect(time, 'Escolha primeiro o médico e a data');
        date.value = '';
        date.disabled = true;
        continueButton.disabled = true;
        try {
            const doctors = await api(`/api/doctors/specialty?name=${encodeURIComponent(specialty)}`);
            setSelect(doctor, doctors.length ? 'Selecione o médico' : 'Nenhum médico disponível', !doctors.length);
            doctors.forEach(item => doctor.insertAdjacentHTML('beforeend',
                `<option value="${item.id}" data-name="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`));
        } catch (error) {
            setSelect(doctor, 'Não foi possível carregar os médicos');
            setFeedback(error.message, 'error');
        }
    }

    async function loadTimes() {
        setSelect(time, 'Carregando horários...');
        continueButton.disabled = true;
        setFeedback();
        if (!doctor.value || !date.value) return;
        try {
            const times = await api(`/api/doctors/${doctor.value}/available-times?date=${date.value}`);
            setSelect(time, times.length ? 'Selecione o horário' : 'Nenhum horário disponível', !times.length);
            times.forEach(hour => time.insertAdjacentHTML('beforeend', `<option value="${hour}">${hour}</option>`));
            if (!times.length) setFeedback('Este médico não possui horários livres nessa data. Escolha outro dia.', 'warning');
        } catch (error) {
            setSelect(time, 'Não foi possível carregar horários');
            setFeedback(error.message, 'error');
        }
    }

    function resetBooking() {
        specialty = '';
        section.hidden = true;
        review.hidden = true;
        header.hidden = false;
        specialties.hidden = false;
        doctor.value = '';
        date.value = '';
        time.value = '';
        setFeedback();
    }

    specialties.addEventListener('click', event => {
        const button = event.target.closest('.specialty-btn');
        if (button) selectSpecialty(button.textContent.trim());
    });
    document.getElementById('btn-back-agenda').addEventListener('click', resetBooking);

    doctor.addEventListener('change', () => {
        date.disabled = false;
        date.value = '';
        setSelect(time, 'Escolha uma data');
    });
    date.addEventListener('change', () => {
        loadTimes();
    });
    time.addEventListener('change', () => {
        continueButton.disabled = !time.value;
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!doctor.value || !date.value || !time.value) {
            setFeedback('Escolha o médico, a data e o horário para continuar.', 'error');
            return;
        }
        const selectedDateTime = `${date.value}T${time.value}`;
        if (selectedDateTime < windowStart || selectedDateTime > windowEnd) {
            setFeedback('A data escolhida está fora da janela permitida para agendamento.', 'error');
            return;
        }
        reviewContent.innerHTML = `
            <div><span>Especialidade</span><strong>${escapeHtml(specialty)}</strong></div>
            <div><span>Médico</span><strong>${escapeHtml(doctor.selectedOptions[0].dataset.name)}</strong></div>
            <div><span>Data</span><strong>${escapeHtml(formatDate(date.value))}</strong></div>
            <div><span>Horário</span><strong>${escapeHtml(time.value)}</strong></div>`;
        form.hidden = true;
        review.hidden = false;
    });

    document.getElementById('btn-edit-booking').addEventListener('click', () => {
        review.hidden = true;
        form.hidden = false;
    });
    confirmButton.addEventListener('click', async () => {
        setButtonLoading(confirmButton, true, 'Confirmando...');
        try {
            const saved = await api('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: Number(doctor.value),
                    doctorName: doctor.selectedOptions[0].dataset.name,
                    specialty,
                    appointmentDate: date.value,
                    appointmentTime: time.value
                })
            });
            onAppointmentCreated(saved);
            resetBooking();
            notify('Consulta marcada com sucesso. Ela já está disponível no Histórico.');
        } catch (error) {
            review.hidden = true;
            form.hidden = false;
            setFeedback(error.message, 'error');
        } finally {
            setButtonLoading(confirmButton, false);
        }
    });

    loadWindow().catch(error => setFeedback(error.message, 'error'));
    loadSpecialties();
}

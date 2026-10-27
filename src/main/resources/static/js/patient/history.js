import { api } from './api.js';
import { escapeHtml, formatDate, parseAppointmentDate, relativeDate, setButtonLoading } from './ui.js';

const STATUS = {
    AGENDADO: { key: 'upcoming', label: 'Agendada', css: 'ongoing' },
    CONCLUIDO: { key: 'completed', label: 'Concluída', css: 'done' },
    CANCELADO: { key: 'cancelled', label: 'Cancelada', css: 'cancelled' }
};

export function initHistory({ notify }) {
    const list = document.getElementById('history-list');
    const patientName = document.getElementById('history-patient-name');
    const search = document.getElementById('search-history');
    const specialtyFilter = document.getElementById('history-specialty');
    const periodFilter = document.getElementById('history-period');
    const tabs = [...document.querySelectorAll('[data-history-status]')];
    const dialog = document.getElementById('documents-dialog');
    const dialogTitle = document.getElementById('documents-dialog-title');
    const dialogBody = document.getElementById('documents-dialog-body');
    let appointments = [];
    let currentStatus = 'upcoming';

    function appointmentTime(item) {
        return parseAppointmentDate(item.appointmentDate, item.appointmentTime).getTime();
    }

    function matchesFilters(item) {
        const status = STATUS[item.status] || STATUS.AGENDADO;
        if (status.key !== currentStatus) return false;
        const query = search.value.trim().toLocaleLowerCase('pt-BR');
        const text = `${item.doctorName ?? ''} ${item.specialty ?? ''}`.toLocaleLowerCase('pt-BR');
        if (query && !text.includes(query)) return false;
        if (specialtyFilter.value && item.specialty !== specialtyFilter.value) return false;
        const days = Number(periodFilter.value);
        if (days) {
            const difference = Math.abs(appointmentTime(item) - Date.now());
            if (difference > days * 86400000) return false;
        }
        return true;
    }

    function sorted(items) {
        return [...items].sort((first, second) => currentStatus === 'upcoming'
            ? appointmentTime(first) - appointmentTime(second)
            : appointmentTime(second) - appointmentTime(first));
    }

    function card(item) {
        const status = STATUS[item.status] || STATUS.AGENDADO;
        return `
            <article class="history-card" data-appointment-id="${item.id}">
                <div class="history-card-heading">
                    <div><span class="history-specialty">${escapeHtml(item.specialty)}</span><h4>${escapeHtml(item.doctorName)}</h4></div>
                    <span class="status-pill ${status.css}"><span class="dot"></span>${status.label}</span>
                </div>
                <div class="history-date-block">
                    <strong>${escapeHtml(formatDate(item.appointmentDate))} às ${escapeHtml(item.appointmentTime)}</strong>
                    <span>${escapeHtml(relativeDate(item.appointmentDate, item.appointmentTime))}</span>
                </div>
                <div class="history-location">Unidade Central · Sala a definir</div>
                <div class="history-card-actions">
                    ${item.status === 'AGENDADO' ? '<button type="button" class="history-action danger" data-cancel>Cancelar consulta</button>' : ''}
                    ${item.status === 'CONCLUIDO' ? '<button type="button" class="history-action" data-documents>Ver documentos médicos</button>' : ''}
                </div>
            </article>`;
    }

    function updateCounts() {
        tabs.forEach(tab => {
            const count = appointments.filter(item => (STATUS[item.status] || STATUS.AGENDADO).key === tab.dataset.historyStatus).length;
            tab.querySelector('span').textContent = count;
        });
    }

    function updateSpecialties() {
        const selected = specialtyFilter.value;
        const values = [...new Set(appointments.map(item => item.specialty).filter(Boolean))].sort();
        specialtyFilter.innerHTML = '<option value="">Todas as especialidades</option>' +
            values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
        if (values.includes(selected)) specialtyFilter.value = selected;
    }

    function render() {
        updateCounts();
        const visible = sorted(appointments.filter(matchesFilters));
        list.innerHTML = visible.length ? visible.map(card).join('') : `
            <div class="history-empty">
                <strong>Nenhuma consulta encontrada</strong>
                <span>Altere os filtros ou marque uma nova consulta.</span>
            </div>`;
    }

    async function cancelAppointment(cardElement, button) {
        if (!window.confirm('Tem certeza que deseja cancelar esta consulta?')) return;
        setButtonLoading(button, true, 'Cancelando...');
        try {
            const updated = await api(`/api/appointments/${cardElement.dataset.appointmentId}/cancel`, { method: 'PUT' });
            appointments = appointments.map(item => item.id === updated.id ? updated : item);
            render();
            notify('Consulta cancelada com sucesso.');
        } catch (error) {
            notify(error.message, 'error');
            setButtonLoading(button, false);
        }
    }

    async function openDocuments(item) {
        dialogTitle.textContent = `${item.specialty} · ${formatDate(item.appointmentDate)}`;
        dialogBody.innerHTML = '<div class="content-loading"><span class="loading-spinner"></span>Carregando documentos...</div>';
        dialog.showModal();
        try {
            const documents = await api(`/api/medical-documents/appointments/${item.id}`);
            dialogBody.innerHTML = documents.length ? documents.map(document => `
                <a class="document-dialog-link" href="${document.downloadUrl}" target="_blank" rel="noopener">
                    <span>${escapeHtml(({ ATESTADO: 'Atestado', RECEITA: 'Receita', EXAME: 'Exame', OUTRO: 'Documento' })[document.type] || document.type)}</span>
                    <strong>${escapeHtml(document.title)}</strong>
                    <small>Abrir PDF</small>
                </a>`).join('') : '<div class="inline-empty">Nenhum documento foi enviado para esta consulta.</div>';
        } catch (error) {
            dialogBody.innerHTML = `<div class="inline-error">${escapeHtml(error.message)}</div>`;
        }
    }

    list.addEventListener('click', event => {
        const cardElement = event.target.closest('[data-appointment-id]');
        if (!cardElement) return;
        const item = appointments.find(value => String(value.id) === cardElement.dataset.appointmentId);
        if (event.target.closest('[data-cancel]')) cancelAppointment(cardElement, event.target.closest('button'));
        if (event.target.closest('[data-documents]') && item) openDocuments(item);
    });
    tabs.forEach(tab => tab.addEventListener('click', () => {
        currentStatus = tab.dataset.historyStatus;
        tabs.forEach(item => item.classList.toggle('active', item === tab));
        render();
    }));
    [search, specialtyFilter, periodFilter].forEach(element => element.addEventListener('input', render));
    document.getElementById('close-documents-dialog').addEventListener('click', () => dialog.close());

    return {
        setData(items, user) {
            appointments = items;
            patientName.textContent = user.name;
            updateSpecialties();
            render();
        },
        add(item) {
            appointments = [item, ...appointments];
            updateSpecialties();
            render();
        },
        setPatientName(name) {
            patientName.textContent = name;
        }
    };
}

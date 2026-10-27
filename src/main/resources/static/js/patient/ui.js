export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
}

export function parseAppointmentDate(value, time = '00:00') {
    if (!value) return new Date(Number.NaN);
    let normalized = value;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/');
        normalized = `${year}-${month}-${day}`;
    }
    return new Date(`${normalized}T${time}`);
}

export function formatDate(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric'
    }).format(parseAppointmentDate(value, '12:00'));
}

export function relativeDate(date, time = '00:00') {
    const difference = parseAppointmentDate(date, time).getTime() - Date.now();
    const absolute = Math.abs(difference);
    const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
    if (absolute < 3600000) return formatter.format(Math.round(difference / 60000), 'minute');
    if (absolute < 86400000) return formatter.format(Math.round(difference / 3600000), 'hour');
    return formatter.format(Math.round(difference / 86400000), 'day');
}

export function createNotifier() {
    const region = document.getElementById('app-notifications');
    let timer;
    return (message, type = 'success') => {
        if (!region) return;
        clearTimeout(timer);
        region.textContent = message;
        region.className = `app-notification show ${type}`;
        timer = setTimeout(() => region.className = 'app-notification', 5000);
    };
}

export function setButtonLoading(button, loading, loadingText = 'Carregando...') {
    if (!button) return;
    if (loading) {
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.classList.add('is-loading');
        button.textContent = loadingText;
        return;
    }
    button.disabled = false;
    button.classList.remove('is-loading');
    button.textContent = button.dataset.originalText || button.textContent;
}

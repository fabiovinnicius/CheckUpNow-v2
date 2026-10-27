import { api } from './api.js';
import { initBooking } from './booking.js';
import { initHistory } from './history.js';
import { initNavigation } from './navigation.js';
import { initProfile } from './profile.js';
import { createNotifier } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const notify = createNotifier();
    initNavigation();
    const history = initHistory({ notify });
    const profile = initProfile({ notify, onUserUpdated: user => history.setPatientName(user.name) });
    initBooking({ notify, onAppointmentCreated: appointment => history.add(appointment) });

    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '<div class="content-loading"><span class="loading-spinner"></span>Carregando suas consultas...</div>';
    try {
        const [user, appointments] = await Promise.all([
            api('/api/auth/me'),
            api('/api/appointments')
        ]);
        localStorage.setItem('checkupUser', JSON.stringify(user));
        history.setData(appointments, user);
        profile.populate(user);
    } catch (error) {
        historyList.innerHTML = '<div class="history-empty"><strong>Não foi possível carregar o painel</strong><span>Atualize a página para tentar novamente.</span></div>';
        notify(error.message, 'error');
    }
});
